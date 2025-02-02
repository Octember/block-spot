import { type PrismaClient } from "@prisma/client";
import express from "express";
import { Stripe } from "stripe";
import { type MiddlewareConfigFn, HttpError } from "wasp/server";
import { type PaymentsWebhook } from "wasp/server/api";
import { emailSender } from "wasp/server/email";
import { z } from "zod";
import { requireNodeEnvVar } from "../../server/utils";
import { assertUnreachable } from "../../shared/utils";
import { PaymentPlanId, paymentPlans, SubscriptionStatus } from "../plans";
import { updateOrganizationStripePaymentDetails } from "./paymentDetails";
import { stripe } from "./stripeClient";

export const stripeWebhook: PaymentsWebhook = async (
  request,
  response,
  context,
) => {
  const secret = requireNodeEnvVar("STRIPE_WEBHOOK_SECRET");
  const sig = request.headers["stripe-signature"];
  if (!sig) {
    throw new HttpError(400, "Stripe Webhook Signature Not Provided");
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (_err) {
    throw new HttpError(400, "Error Constructing Stripe Webhook Event");
  }

  // Extract session/subscription data before the switch to avoid lexical declarations in case blocks
  const session =
    event.type === "checkout.session.completed"
      ? (event.data.object as Stripe.Checkout.Session)
      : null;
  const invoice =
    event.type === "invoice.paid"
      ? (event.data.object as Stripe.Invoice)
      : null;
  const updatedSubscription =
    event.type === "customer.subscription.updated"
      ? (event.data.object as Stripe.Subscription)
      : null;
  const deletedSubscription =
    event.type === "customer.subscription.deleted"
      ? (event.data.object as Stripe.Subscription)
      : null;

  console.log("STRIPE WEBHOOK", { event });

  const prismaOrganizationDelegate = context.entities.Organization;

  switch (event.type) {
    case "checkout.session.completed":
      if (session) {
        await handleCheckoutSessionCompleted(
          session,
          prismaOrganizationDelegate,
        );
      }
      break;
    case "invoice.paid":
      if (invoice) {
        await handleInvoicePaid(invoice, prismaOrganizationDelegate);
      }
      break;
    case "customer.subscription.updated":
      if (updatedSubscription) {
        await handleCustomerSubscriptionUpdated(
          updatedSubscription,
          prismaOrganizationDelegate,
        );
      }
      break;
    case "customer.subscription.deleted":
      if (deletedSubscription) {
        await handleCustomerSubscriptionDeleted(
          deletedSubscription,
          prismaOrganizationDelegate,
        );
      }
      break;
    default:
      // If you'd like to handle more events, you can add more cases above.
      // When deploying your app, you configure your webhook in the Stripe dashboard to only send the events that you're
      // handling above and that are necessary for the functioning of your app. See: https://docs.opensaas.sh/guides/deploying/#setting-up-your-stripe-webhook
      // In development, it is likely that you will receive other events that you are not handling, and that's fine. These can be ignored without any issues.
      console.error("Unhandled event type: ", event.type);
  }
  response.json({ received: true }); // Stripe expects a 200 response to acknowledge receipt of the webhook
};

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (
  middlewareConfig,
) => {
  // We need to delete the default 'express.json' middleware and replace it with 'express.raw' middleware
  // because webhook data in the body of the request as raw JSON, not as JSON in the body of the request.
  middlewareConfig.delete("express.json");
  middlewareConfig.set(
    "express.raw",
    express.raw({ type: "application/json" }),
  );
  return middlewareConfig;
};

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  prismaOrganizationDelegate: PrismaClient["organization"],
) {
  const stripeCustomerId = validateStripeCustomerIdOrThrow(session.customer);
  const { line_items } = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });

  const lineItemPriceId = extractPriceId(line_items);

  const planId = getPlanIdByPriceId(lineItemPriceId);
  const plan = paymentPlans[planId];

  let subscriptionPlan: PaymentPlanId | undefined;
  switch (plan.effect.kind) {
    case "subscription":
      subscriptionPlan = planId;
      break;
    case "credits":
      break;
    default:
      assertUnreachable(plan.effect);
  }

  console.log("handleCheckoutSessionCompleted", { session, plan });

  await prismaOrganizationDelegate.update({
    where: { stripeCustomerId },
    data: {
      onboardingState: {
        update: {
          hasSelectedPlan: true,
        },
      },
    },
  });

  const organization = await updateOrganizationStripePaymentDetails(
    {
      stripeCustomerId,
      subscriptionPlan,
      subscriptionStatus: "active",
      datePaid: new Date(),
    },
    prismaOrganizationDelegate,
  );

  // Send email to organization owner
  const owner = await prismaOrganizationDelegate
    .findUnique({
      where: { id: organization.id },
      include: {
        users: {
          where: { role: "OWNER" },
          include: { user: true },
        },
      },
    })
    .then((org) => org?.users[0]?.user);

  if (owner?.email) {
    await emailSender.send({
      to: owner.email,
      subject: "Payment Successful!",
      text: `Thank you for your payment. Your organization's subscription has been updated.`,
      html: `Thank you for your payment. Your organization's subscription has been updated.`,
    });
  }

  return organization;
}

export async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  prismaOrganizationDelegate: PrismaClient["organization"],
) {
  const stripeCustomerId = validateStripeCustomerIdOrThrow(invoice.customer);
  const datePaid = new Date(invoice.period_start * 1000);
  return updateOrganizationStripePaymentDetails(
    { stripeCustomerId, datePaid },
    prismaOrganizationDelegate,
  );
}

export async function handleCustomerSubscriptionUpdated(
  subscription: Stripe.Subscription,
  prismaOrganizationDelegate: PrismaClient["organization"],
) {
  const stripeCustomerId = validateStripeCustomerIdOrThrow(
    subscription.customer,
  );
  let subscriptionStatus: SubscriptionStatus | undefined;

  const priceId = extractPriceId(subscription.items);
  const subscriptionPlan = getPlanIdByPriceId(priceId);

  // There are other subscription statuses, such as `trialing` that we are not handling and simply ignore
  // If you'd like to handle more statuses, you can add more cases above. Make sure to update the `SubscriptionStatus` type in `payment/plans.ts` as well
  if (subscription.status === "active") {
    subscriptionStatus = subscription.cancel_at_period_end
      ? "cancel_at_period_end"
      : "active";
  } else if (subscription.status === "past_due") {
    subscriptionStatus = "past_due";
  }
  if (subscriptionStatus) {
    const organization = await updateOrganizationStripePaymentDetails(
      { stripeCustomerId, subscriptionPlan, subscriptionStatus },
      prismaOrganizationDelegate,
    );

    if (subscription.cancel_at_period_end) {
      // Send email to organization owner
      const owner = await prismaOrganizationDelegate
        .findUnique({
          where: { id: organization.id },
          include: {
            users: {
              where: { role: "OWNER" },
              include: { user: true },
            },
          },
        })
        .then((org) => org?.users[0]?.user);

      if (owner?.email) {
        await emailSender.send({
          to: owner.email,
          subject: "We hate to see you go :(",
          text: "We hate to see you go. Here is a sweet offer...",
          html: "We hate to see you go. Here is a sweet offer...",
        });
      }
    }
    return organization;
  }
}

export async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription,
  prismaOrganizationDelegate: PrismaClient["organization"],
) {
  const stripeCustomerId = validateStripeCustomerIdOrThrow(
    subscription.customer,
  );
  return updateOrganizationStripePaymentDetails(
    { stripeCustomerId, subscriptionStatus: "deleted" },
    prismaOrganizationDelegate,
  );
}

function validateStripeCustomerIdOrThrow(
  stripeCustomerId: Stripe.Checkout.Session["customer"],
): string {
  if (!stripeCustomerId) throw new HttpError(400, "No customer id");
  if (typeof stripeCustomerId !== "string")
    throw new HttpError(400, "Customer id is not a string");
  return stripeCustomerId;
}

const LineItemsPriceSchema = z.object({
  data: z.array(
    z.object({
      price: z.object({
        id: z.string(),
      }),
    }),
  ),
});

function extractPriceId(
  items: Stripe.Checkout.Session["line_items"] | Stripe.Subscription["items"],
) {
  const result = LineItemsPriceSchema.safeParse(items);
  if (!result.success) {
    throw new HttpError(400, "No price id in stripe event object");
  }
  if (result.data.data.length > 1) {
    throw new HttpError(400, "More than one item in stripe event object");
  }
  return result.data.data[0].price.id;
}

function getPlanIdByPriceId(priceId: string): PaymentPlanId {
  const planId = Object.values(PaymentPlanId).find(
    (planId) => paymentPlans[planId].getPaymentProcessorPlanId() === priceId,
  );
  if (!planId) {
    throw new Error(`No plan with Stripe price id ${priceId}`);
  }
  return planId;
}

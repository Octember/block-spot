import { HttpError } from "wasp/server";
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
  ConfirmPaidBooking,
} from "wasp/server/operations";
import { PaymentPlanId, paymentPlans } from "../payment/plans";
import { paymentProcessor } from "./paymentProcessor";
import { Reservation } from "wasp/entities";
import { type StripeCheckoutSession } from "@stripe/stripe-js";
import { stripe } from "./stripe/stripeClient";

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

type GenerateCheckoutSessionArgs = {
  organizationId: string;
  planId: PaymentPlanId;
  returnToOnboarding?: boolean;
};

/** @deprecated Legacy: was used for checkout in onboarding */
export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionArgs,
  CheckoutSession
> = async ({ organizationId, planId, returnToOnboarding }, context) => {
  if (!context.user) {
    console.log(
      `[PAYMENTS] Unauthorized attempt to generate checkout session for org ${organizationId}`,
    );
    throw new HttpError(401);
  }

  const organization = await context.entities.Organization.findFirst({
    where: {
      id: organizationId,
      users: {
        some: {
          userId: context.user.id,
          role: "OWNER",
        },
      },
    },
  });

  if (!organization) {
    console.log(
      `[PAYMENTS] Non-owner user ${context.user.id} attempted to create checkout for org ${organizationId}`,
    );
    throw new HttpError(
      403,
      "You must be an organization owner to make payments",
    );
  }

  if (!context.user.email) {
    console.log(
      `[PAYMENTS] User ${context.user.id} attempted payment without email`,
    );
    throw new HttpError(403, "User needs an email to make a payment");
  }

  const paymentPlan = paymentPlans[planId];
  if (!paymentPlan) {
    console.log(`[PAYMENTS] Invalid payment plan requested: ${planId}`);
    throw new HttpError(400, "Invalid payment plan");
  }

  // Handle free community plan
  if (planId === PaymentPlanId.Community) {
    console.log(
      `[PAYMENTS] Setting up free community plan for org ${organizationId}`,
    );
    await context.entities.Organization.update({
      where: { id: organizationId },
      data: {
        subscriptionPlanId: PaymentPlanId.Community,
        subscriptionStatus: "active",
        datePaid: new Date(),
      },
    });

    return {
      sessionUrl: returnToOnboarding
        ? "/onboarding/complete?success=true"
        : "/checkout?success=true",
      sessionId: "free_plan",
    };
  }

  const { session } = await paymentProcessor.createCheckoutSession({
    organizationId,
    organizationEmail: context.user.email,
    paymentPlan,
    prismaOrganizationDelegate: context.entities.Organization,
    returnToOnboarding,
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
};

type GetCustomerPortalUrlArgs = {
  organizationId: string;
};

export const getCustomerPortalUrl: GetCustomerPortalUrl<
  GetCustomerPortalUrlArgs,
  string | null
> = async ({ organizationId }, context) => {
  if (!context.user) {
    console.log(
      `[PAYMENTS] Unauthorized attempt to access customer portal for org ${organizationId}`,
    );
    throw new HttpError(401);
  }

  const organization = await context.entities.Organization.findFirst({
    where: {
      id: organizationId,
      users: {
        some: {
          userId: context.user.id,
          role: "OWNER",
        },
      },
    },
  });

  if (!organization) {
    console.log(
      `[PAYMENTS] Non-owner user ${context.user.id} attempted to access billing portal for org ${organizationId}`,
    );
    throw new HttpError(
      403,
      "You must be an organization owner to access billing portal",
    );
  }

  console.log(
    `[PAYMENTS] Generating customer portal URL for org ${organizationId}`,
  );
  return paymentProcessor.fetchCustomerPortalUrl({
    organizationId,
    prismaOrganizationDelegate: context.entities.Organization,
  });
};

type ConfirmPaidBookingArgs = {
  checkoutSessionId: string;
  venueId: string;
};

export const confirmPaidBooking: ConfirmPaidBooking<
  ConfirmPaidBookingArgs,
  void
> = async ({ checkoutSessionId, venueId }, context) => {
  if (!context.user) {
    console.log(
      `[PAYMENTS] Unauthorized attempt to confirm booking for venue ${venueId}`,
    );
    throw new HttpError(401, "User not authenticated");
  }

  const organization = await context.entities.Organization.findFirst({
    where: {
      venues: {
        some: { id: venueId },
      },
    },
  });

  if (!organization || !organization.stripeAccountId) {
    console.log(
      `[PAYMENTS] Organization not found or missing Stripe account for venue ${venueId}`,
    );
    throw new HttpError(
      404,
      "Organization not found or missing stripe account",
    );
  }

  console.log(
    `[PAYMENTS] Retrieving Stripe session ${checkoutSessionId} for org ${organization.id}`,
  );
  // Retrieve payment session from Stripe
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    stripeAccount: organization.stripeAccountId,
  });

  if (session.payment_status !== "paid") {
    console.log(
      `[PAYMENTS] Incomplete payment status for session ${checkoutSessionId}: ${session.payment_status}`,
    );
    throw new HttpError(400, "Payment not completed");
  }

  // Extract metadata from Stripe session
  const userId = session.metadata?.userId;
  const spaceId = session.metadata?.spaceId;
  const startTime = new Date(session.metadata?.startTime || "");
  const endTime = new Date(session.metadata?.endTime || "");

  if (!userId || !spaceId || !startTime || !endTime) {
    console.log(
      `[PAYMENTS] Invalid metadata in session ${checkoutSessionId}: userId=${userId}, spaceId=${spaceId}`,
    );
    throw new HttpError(400, "Invalid session metadata");
  }

  console.log(
    `[PAYMENTS] Validating availability for space ${spaceId} from ${startTime} to ${endTime}`,
  );
  // Double-check availability before creating reservation
  const isSlotTaken = await context.entities.Reservation.findFirst({
    where: {
      spaceId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      status: { not: "CANCELLED" },
    },
  });

  if (isSlotTaken) {
    try {
      const refund = await stripe.refunds.create({
        charge: session.payment_intent as string, // Stripe charge ID
      });

      console.log(
        `[PAYMENTS] Refund successful: ${refund.id} for session ${checkoutSessionId}`,
      );

      throw new HttpError(
        409,
        "Slot was taken before payment completed. Refund issued.",
      );
    } catch (refundError) {
      console.error("Refund failed:", refundError);
      throw new HttpError(
        500,
        "Payment failed and refund could not be processed.",
      );
    }
  }

  const reservation = await context.entities.Reservation.create({
    data: {
      userId,
      spaceId,
      startTime,
      endTime,
      status: "PAID", // Directly mark as paid
    },
  });

  await context.entities.Payment.create({
    data: {
      reservationId: reservation.id,
      stripeCheckoutSessionId: checkoutSessionId,
    },
  });
  console.log(`[PAYMENTS] Confirmed paid booking: ${reservation.id}`);

  return undefined;
};

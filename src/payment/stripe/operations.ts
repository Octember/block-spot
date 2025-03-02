import { HttpError } from "wasp/server";
import { config } from "wasp/server";
import {
  CreateStripeAccount,
  CreateConnectCheckoutSession,
  CreateStripeAccountLink,
} from "wasp/server/operations";
import {
  createStripeAccountApiCall,
  getUserOrganization,
} from "./connect/utils";
import { stripe } from "./stripeClient";
import { runPaymentRules } from "../../schedule/operations/payment-rules";

export const createStripeAccount: CreateStripeAccount = async (
  _args,
  context,
) => {
  if (!context.user) {
    console.log(`[STRIPE] Unauthorized attempt to create Stripe account`);
    throw new HttpError(401, "Unauthorized");
  }

  const { user, organization } = await getUserOrganization(
    context.user.id,
    context.entities.User,
  );

  if (organization.stripeAccountId) {
    console.log(
      `[STRIPE] Organization ${organization.id} already has Stripe account ${organization.stripeAccountId}`,
    );
    throw new HttpError(400, "Organization already has a Stripe account");
  }

  console.log(
    `[STRIPE] Creating Stripe account for organization ${organization.id}`,
  );
  const accountId = await createStripeAccountApiCall(user, organization);

  // update the organization with the new account id
  console.log(
    `[STRIPE] Linking Stripe account ${accountId} to organization ${organization.id}`,
  );
  await context.entities.Organization.update({
    where: { id: organization.id },
    data: { stripeAccountId: accountId },
  });

  return accountId;
};

export function getFrontendUrl() {
  const env = process.env.NODE_ENV || "development";
  if (env === "development") {
    return "http://localhost:3000";
  }
  return config.frontendUrl;
}

export const createStripeAccountLink: CreateStripeAccountLink<
  never,
  string
> = async (_args, context) => {
  if (!context.user) {
    console.log(`[STRIPE] Unauthorized attempt to create account link`);
    throw new HttpError(401, "Unauthorized");
  }

  const { organization } = await getUserOrganization(
    context.user.id,
    context.entities.User,
  );

  const account = organization.stripeAccountId;

  if (!account) {
    console.log(
      `[STRIPE] Organization ${organization.id} attempted to create account link without Stripe account`,
    );
    throw new HttpError(400, "Organization does not have a Stripe account");
  }

  console.log(`[STRIPE] Creating account link for Stripe account ${account}`);
  const frontendUrl = getFrontendUrl();

  const accountLink = await stripe.accountLinks.create({
    account: account,
    return_url: `${frontendUrl}/stripe-return/${account}`,
    refresh_url: `${frontendUrl}/stripe-refresh/${account}`,
    type: "account_onboarding",
  });

  return accountLink.url;
};

type CreateConnectCheckoutSessionResult = {
  checkoutSessionId: string;
  clientSecret: string;
};

export const createConnectCheckoutSession: CreateConnectCheckoutSession<
  { userId: string; spaceId: string; startTime: Date; endTime: Date },
  CreateConnectCheckoutSessionResult
> = async ({ userId, spaceId, startTime, endTime }, context) => {
  if (!context.user) {
    console.warn(
      `[STRIPE] Unauthorized attempt to create checkout session for space ${spaceId}`,
    );
    throw new HttpError(401);
  }

  const space = await context.entities.Space.findUnique({
    where: { id: spaceId },
    include: { venue: { include: { paymentRules: true } } },
  });

  if (!space) {
    console.warn(`[STRIPE] Space not found: ${spaceId}`);
    throw new HttpError(404, "Space not found");
  }

  // Check if the slot is already taken
  const isSlotTaken = await context.entities.Reservation.findFirst({
    where: {
      spaceId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      status: { not: "CANCELLED" }, // Ignore cancelled reservations
    },
  });

  if (isSlotTaken) {
    console.log(
      `[STRIPE] Time slot conflict for space ${spaceId}: ${startTime} - ${endTime}`,
    );
    throw new HttpError(400, "Time slot is already booked");
  }

  const { requiresPayment, totalCost } = runPaymentRules(
    space.venue.paymentRules,
    startTime,
    endTime,
    space.id,
  );

  if (!context.user) {
    console.log(
      `[STRIPE] User authentication lost during checkout session creation`,
    );
    throw new HttpError(401, "Unauthorized");
  }

  const { organization } = await getUserOrganization(
    context.user.id,
    context.entities.User,
  );

  if (!organization.stripeAccountId) {
    console.warn(
      `[STRIPE] Organization ${organization.id} attempted checkout without Stripe account`,
    );
    throw new HttpError(400, "Organization does not have a Stripe account");
  }

  if (!requiresPayment) {
    console.warn(
      `[STRIPE] Attempted to create checkout for non-paid reservation`,
    );
    throw new HttpError(400, "This reservation does not require payment");
  }

  console.log(
    `[STRIPE] Creating checkout session for space ${spaceId}, amount: ${totalCost}`,
  );
  const session = await stripe.checkout.sessions.create(
    {
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Booking for ${space.name}` },
            unit_amount: parseInt(totalCost.toString()) * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      redirect_on_completion: "never",
      customer_email: context.user.email || undefined,
      mode: "payment",
      metadata: {
        userId,
        spaceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        totalCost: totalCost.toString(),
      },
    },
    {
      stripeAccount: organization.stripeAccountId,
    },
  );

  if (!session.client_secret) {
    console.log(
      `[STRIPE] Failed to create payment intent for space ${spaceId}`,
    );
    throw new Error("Failed to create payment intent");
  }

  console.log(
    `[STRIPE] Created checkout session ${session.id} for space ${spaceId}`,
  );
  return {
    checkoutSessionId: session.id,
    clientSecret: session.client_secret,
  };
};

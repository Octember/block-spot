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
    throw new HttpError(
      403,
      "You must be an organization owner to make payments",
    );
  }

  if (!context.user.email) {
    throw new HttpError(403, "User needs an email to make a payment");
  }

  const paymentPlan = paymentPlans[planId];
  if (!paymentPlan) {
    throw new HttpError(400, "Invalid payment plan");
  }

  // Handle free community plan
  if (planId === PaymentPlanId.Community) {
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
    throw new HttpError(
      403,
      "You must be an organization owner to access billing portal",
    );
  }

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
    throw new HttpError(
      404,
      "Organization not found or missing stripe account",
    );
  }

  // Retrieve payment session from Stripe
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    stripeAccount: organization.stripeAccountId,
  });
  
  if (session.payment_status !== "paid") {
    throw new HttpError(400, "Payment not completed");
  }

  // Extract metadata from Stripe session
  const userId = session.metadata?.userId;
  const spaceId = session.metadata?.spaceId;
  const startTime = new Date(session.metadata?.startTime || "");
  const endTime = new Date(session.metadata?.endTime || "");

  if (!userId || !spaceId || !startTime || !endTime) {
    throw new HttpError(400, "Invalid session metadata");
  }

  // Double-check availability before creating reservation
  const isSlotTaken = await context.entities.Reservation.findFirst({
    where: {
      spaceId,
      startTime: { lt: endTime },
      endTime: { gt: startTime },
      status: { not: "CANCELLED" },
    },
  });

  if (isSlotTaken) throw new HttpError(400, "Time slot was booked by someone else");

  // Create reservation (atomic)
  const reservation = await context.entities.Reservation.create({
    data: {
      userId,
      spaceId,
      startTime,
      endTime,
      status: "PAID", // Directly mark as paid
    },
  });


  console.log("Updating payment:", reservation.id, checkoutSessionId);

  // Create payment record for tracking
  await context.entities.Payment.update({
    where: {
      reservationId: reservation.id,
    },
    data: {
      stripeCheckoutSessionId: checkoutSessionId,
    },
  });

  // Get the reservation associated with this checkout session
  // const reservation = await context.entities.Reservation.findFirst({
  //   where: {
  //     payment: {
  //       stripeCheckoutSessionId: checkoutSessionId,
  //     },
  //   },
  //   include: {
  //     payment: true,
  //   },
  // });

  console.log(`Found stripe session: } Status=${session.status}`);
  // based on this... create the res

  return undefined;
};

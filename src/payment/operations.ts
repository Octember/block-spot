import { HttpError } from "wasp/server";
import type {
  GenerateCheckoutSession,
  GetCustomerPortalUrl,
} from "wasp/server/operations";
import { PaymentPlanId, paymentPlans } from "../payment/plans";
import { paymentProcessor } from "./paymentProcessor";

export type CheckoutSession = {
  sessionUrl: string | null;
  sessionId: string;
};

type GenerateCheckoutSessionArgs = {
  organizationId: string;
  planId: PaymentPlanId;
};

export const generateCheckoutSession: GenerateCheckoutSession<
  GenerateCheckoutSessionArgs,
  CheckoutSession
> = async ({ organizationId, planId }, context) => {
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

  const { session } = await paymentProcessor.createCheckoutSession({
    organizationId,
    organizationEmail: context.user.email,
    paymentPlan,
    prismaOrganizationDelegate: context.entities.Organization,
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

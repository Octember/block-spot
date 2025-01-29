import { requireNodeEnvVar } from "../../server/utils";
import type {
  CreateCheckoutSessionArgs,
  FetchCustomerPortalUrlArgs,
  PaymentProcessor,
} from "../paymentProcessor";
import type { PaymentPlanEffect } from "../plans";
import {
  createStripeCheckoutSession,
  fetchStripeCustomer,
} from "./checkoutUtils";
import { stripeMiddlewareConfigFn, stripeWebhook } from "./webhook";

export type StripeMode = "subscription" | "payment";

export const stripePaymentProcessor: PaymentProcessor = {
  id: "stripe",
  createCheckoutSession: async ({
    organizationId,
    organizationEmail,
    paymentPlan,
    prismaOrganizationDelegate,
  }: CreateCheckoutSessionArgs) => {
    try {
      const priceId = paymentPlan.getPaymentProcessorPlanId();
      if (!priceId) {
        throw new Error("Invalid payment plan ID");
      }

      console.log("Creating checkout session with price ID:", priceId);
      const customer = await fetchStripeCustomer(organizationId, organizationEmail);
      const stripeSession = await createStripeCheckoutSession({
        organizationId,
        priceId,
        customerId: customer.id,
        mode: paymentPlanEffectToStripeMode(paymentPlan.effect),
      });

      await prismaOrganizationDelegate.update({
        where: {
          id: organizationId,
        },
        data: {
          stripeCustomerId: customer.id,
        },
      });

      if (!stripeSession.url)
        throw new Error("Error creating Stripe Checkout Session");
      const session = {
        url: stripeSession.url,
        id: stripeSession.id,
      };
      return { session };
    } catch (error) {
      console.error("Error in createCheckoutSession:", error);
      throw error;
    }
  },
  fetchCustomerPortalUrl: async (_args: FetchCustomerPortalUrlArgs) =>
    requireNodeEnvVar("STRIPE_CUSTOMER_PORTAL_URL"),
  webhook: stripeWebhook,
  webhookMiddlewareConfigFn: stripeMiddlewareConfigFn,
};

function paymentPlanEffectToStripeMode(
  planEffect: PaymentPlanEffect,
): StripeMode {
  const effectToMode: Record<PaymentPlanEffect["kind"], StripeMode> = {
    subscription: "subscription",
    credits: "payment",
  };
  return effectToMode[planEffect.kind];
}

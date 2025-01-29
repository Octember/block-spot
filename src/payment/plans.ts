import { requireNodeEnvVar } from "../server/utils";

export type SubscriptionStatus =
  | "past_due"
  | "cancel_at_period_end"
  | "active"
  | "deleted";

export enum PaymentPlanId {
  Community = "community",
  Business = "business",
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe, or variant id on LemonSqueezy.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect =
  | { kind: "subscription" }
  | { kind: "credits"; amount: number }

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.Community]: {
    getPaymentProcessorPlanId: () =>
      requireNodeEnvVar("PAYMENTS_COMMUNITY_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" },
  },
  [PaymentPlanId.Business]: {
    getPaymentProcessorPlanId: () =>
      requireNodeEnvVar("PAYMENTS_BUSINESS_SUBSCRIPTION_PLAN_ID"),
    effect: { kind: "subscription" },
  },
  
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.Community]: "Community",
    [PaymentPlanId.Business]: "Business",
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getSubscriptionPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter(
    (planId) => paymentPlans[planId].effect.kind === "subscription",
  );
}

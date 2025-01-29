import { PrismaClient } from "@prisma/client";
import type { SubscriptionStatus } from "../plans";
import { PaymentPlanId } from "../plans";

export const updateOrganizationStripePaymentDetails = (
  {
    stripeCustomerId,
    subscriptionPlan,
    subscriptionStatus,
    datePaid,
    numOfCreditsPurchased,
  }: {
    stripeCustomerId: string;
    subscriptionPlan?: PaymentPlanId;
    subscriptionStatus?: SubscriptionStatus;
    numOfCreditsPurchased?: number;
    datePaid?: Date;
  },
  organizationDelegate: PrismaClient["organization"],
) => {
  return organizationDelegate.update({
    where: {
      stripeCustomerId,
    },
    data: {
      stripeCustomerId,
      subscriptionPlanId: subscriptionPlan,
      subscriptionStatus,
      datePaid,
      credits:
        numOfCreditsPurchased !== undefined
          ? { increment: numOfCreditsPurchased }
          : undefined,
    },
  });
};

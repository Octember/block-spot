import { PrismaClient } from "@prisma/client";
import type { SubscriptionStatus } from "../plans";
import { PaymentPlanId } from "../plans";

export const updateOrganizationStripePaymentDetails = (
  {
    stripeCustomerId,
    subscriptionPlan,
    subscriptionStatus,
    datePaid,
  }: {
    stripeCustomerId: string;
    subscriptionPlan?: PaymentPlanId;
    subscriptionStatus?: SubscriptionStatus;
    datePaid?: Date;
  },
  organizationDelegate: PrismaClient["organization"],
) => {
  console.log("updateOrganizationStripePaymentDetails", {
    stripeCustomerId,
    subscriptionPlan,
    subscriptionStatus,
    datePaid,
  });
  
  return organizationDelegate.update({
    where: {
      stripeCustomerId,
    },
    data: {
      stripeCustomerId,
      subscriptionPlanId: subscriptionPlan,
      subscriptionStatus,
      datePaid,
    },
  });
};

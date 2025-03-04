import { HttpError } from "wasp/server";
import type { RunPaymentRules } from "wasp/server/operations";
import { calculatePaymentRulesV2 } from "../../schedule/operations/payment-rules/payment-rules";
import { PriceBreakdown } from "../../schedule/operations/payment-rules/payment-rules";

export const runPaymentRules: RunPaymentRules<
  {
    spaceId: string;
    venueId: string;
    startTime: Date;
    endTime: Date;
  },
  {
    requiresPayment: boolean;
    totalCost: number;
    priceBreakdown?: PriceBreakdown;
  }
> = async ({ spaceId, venueId, startTime, endTime }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }

  // Get space and venue details with payment rules
  const space = await context.entities.Space.findUnique({
    where: { id: spaceId },
    include: {
      venue: {
        include: {
          paymentRules: {
            include: {
              conditions: true,
            },
          },
        },
      },
    },
  });

  if (!space) {
    console.warn(`[PAYMENT] Space not found: ${spaceId}`);
    throw new HttpError(404, "Space not found");
  }

  if (space.venue.id !== venueId) {
    console.warn(
      `[PAYMENT] Space does not belong to specified venue: ${spaceId} ${venueId}`,
    );
    throw new HttpError(400, "Space does not belong to specified venue");
  }

  const result = await calculatePaymentRulesV2({
    rules: space.venue.paymentRules,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    spaceId,
    userId: context.user.id,
    db: {
      organizationUser: context.entities.OrganizationUser,
      space: context.entities.Space,
    },
  });

  return {
    requiresPayment: result.requiresPayment,
    totalCost: result.totalCost,
    priceBreakdown: result.priceBreakdown,
  };
};

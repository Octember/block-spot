import { HttpError } from "wasp/server";
import type {
  RunPaymentRules
} from "wasp/server/operations";
import { runPaymentRules as calculatePaymentRules } from "../../schedule/operations/payment-rules";
import { PriceBreakdown } from "../../schedule/operations/payment-rules";

export const runPaymentRules: RunPaymentRules<
  {
    spaceId: string;
    venueId: string;
    startTime: Date;
    endTime: Date;
  },
  { requiresPayment: boolean; totalCost: number; priceBreakdown?: PriceBreakdown }
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
          paymentRules: true,
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

  return calculatePaymentRules(
    space.venue.paymentRules,
    new Date(startTime),
    new Date(endTime),
    spaceId,
  );
};

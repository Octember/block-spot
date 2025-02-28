import { RuleType } from "@prisma/client";
import { differenceInMinutes } from "date-fns";
import { HttpError } from "wasp/server";
import type { GetReservationPrice, RunPaymentRules } from "wasp/server/operations";
import { stripe } from "../stripe/stripeClient";
import { WireSafePaymentRule } from "./operations";
import { runPaymentRules as calculatePaymentRules } from "../../schedule/operations/new-reservations";

type PriceBreakdownItem = {
  reason: string;
  value: number;
};

type PriceBreakdownResponse = {
  basePrice: number;
  multipliers: PriceBreakdownItem[];
  discounts: PriceBreakdownItem[];
  finalPrice: number;
};

type GetReservationPriceResponse = {
  priceBreakdown: PriceBreakdownResponse;
  checkoutUrl: string;
};

const doesRuleMatch = (
  rule: WireSafePaymentRule,
  startTime: Date,
  endTime: Date,
  userTags: string[] = [],
): boolean => {
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const dayOfWeek = startTime.getDay();
  const minutesFromMidnight =
    startTime.getHours() * 60 + startTime.getMinutes();

  // Check day of week if specified
  if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(dayOfWeek)) {
    return false;
  }

  // Check time of day if specified
  if (rule.startTime != null && rule.endTime != null) {
    if (
      minutesFromMidnight < rule.startTime ||
      minutesFromMidnight >= rule.endTime
    ) {
      return false;
    }
  }

  // Check all conditions - ALL must match for the rule to apply
  for (const condition of rule.conditions) {
    // Duration-based conditions
    if (condition.startTime) {
      // Minimum duration check
      if (durationMinutes < condition.startTime) {
        return false;
      }
    }
    if (condition.endTime) {
      // Maximum duration check
      if (durationMinutes > condition.endTime) {
        return false;
      }
    }

    // User tag conditions
    if (condition.userTags && condition.userTags.length > 0) {
      // Check if user has ANY of the required tags
      const hasMatchingTag = condition.userTags.some((tag) =>
        userTags.includes(tag),
      );
      if (!hasMatchingTag) {
        return false;
      }
    }
  }

  return true;
};

const calculatePriceFromRules = (
  startTime: Date,
  endTime: Date,
  rules: WireSafePaymentRule[],
  userTags: string[] = [],
): PriceBreakdownResponse => {
  const breakdown: PriceBreakdownResponse = {
    basePrice: 0,
    multipliers: [],
    discounts: [],
    finalPrice: 0,
  };

  // Sort rules by priority (lower numbers first)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  const matchedRule = sortedRules.find((rule) =>
    doesRuleMatch(rule, startTime, endTime, userTags),
  );

  if (!matchedRule || !matchedRule.pricePerPeriod) {
    return breakdown;
  }

  const durationMinutes = differenceInMinutes(endTime, startTime);
  const price = parseFloat(matchedRule.pricePerPeriod);

  if (matchedRule.periodMinutes) {
    // Hourly/period-based pricing
    const periods = Math.ceil(durationMinutes / matchedRule.periodMinutes);
    breakdown.basePrice = periods * price;
  } else {
    // Flat fee pricing
    breakdown.basePrice = price;
  }

  breakdown.finalPrice = breakdown.basePrice;
  return breakdown;
};

export const getReservationPrice: GetReservationPrice<
  {
    spaceId: string;
    venueId: string;
    startTime: Date;
    endTime: Date;
  },
  GetReservationPriceResponse
> = async ({ spaceId, venueId, startTime, endTime }, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }

  // Get space and venue details
  const space = await context.entities.Space.findUnique({
    where: { id: spaceId },
    include: {
      venue: {
        include: {
          organization: {
            include: {
              users: {
                where: {
                  userId: context.user.id,
                },
                include: {
                  tags: {
                    include: {
                      organizationTag: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!space) {
    throw new HttpError(404, "Space not found");
  }

  if (space.venue.id !== venueId) {
    throw new HttpError(400, "Space does not belong to specified venue");
  }

  // Get user's tags from the organization
  const orgUser = space.venue.organization.users[0];
  if (!orgUser) {
    throw new HttpError(403, "User is not a member of this organization");
  }
  const userTags = orgUser.tags.map((tag) => tag.organizationTag.name);

  // Get venue payment rules
  const paymentRules = await context.entities.PaymentRule.findMany({
    where: {
      venueId: venueId,
      OR: [
        { spaceIds: { isEmpty: true } }, // Venue-wide rules
        { spaceIds: { has: spaceId } }, // Space-specific rules
      ],
    },
    include: {
      conditions: true,
    },
  });

  if (paymentRules.length === 0) {
    throw new HttpError(400, "No payment rules found for this venue/space");
  }

  // Convert to wire-safe format
  const wireSafeRules: WireSafePaymentRule[] = paymentRules.map((rule) => ({
    ...rule,
    pricePerPeriod: rule.pricePerPeriod?.toString() || null,
    multiplier: rule.multiplier?.toString() || null,
    discountRate: rule.discountRate?.toString() || null,
    conditions: rule.conditions.map((condition) => ({
      ...condition,
      startTime: condition.startTime || null,
      endTime: condition.endTime || null,
      userTags: condition.userTags || [],
    })),
  }));

  // Calculate price
  const priceBreakdown = calculatePriceFromRules(
    startTime,
    endTime,
    wireSafeRules,
    userTags,
  );

  if (priceBreakdown.finalPrice <= 0) {
    throw new HttpError(
      400,
      "Could not calculate a valid price for reservation",
    );
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Space Reservation",
            description: `Reservation from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
          },
          unit_amount: Math.round(priceBreakdown.finalPrice * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      spaceId,
      venueId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    },
    success_url: `${process.env.DOMAIN}/reservations/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.DOMAIN}/reservations/cancel`,
  });

  if (!session.url) {
    throw new HttpError(500, "Failed to create checkout session");
  }

  return {
    priceBreakdown,
    checkoutUrl: session.url,
  };
};

export const runPaymentRules: RunPaymentRules<
  {
    spaceId: string;
    venueId: string;
    startTime: Date;
    endTime: Date;
  },
  { requiresPayment: boolean; totalCost: number }
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
          paymentRules: true
        }
      }
    }
  });

  if (!space) {
    console.warn(`[PAYMENT] Space not found: ${spaceId}`);
    throw new HttpError(404, "Space not found");
  }

  if (space.venue.id !== venueId) {
    console.warn(`[PAYMENT] Space does not belong to specified venue: ${spaceId} ${venueId}`);
    throw new HttpError(400, "Space does not belong to specified venue");
  }

  return calculatePaymentRules(
    space.venue.paymentRules,
    new Date(startTime),
    new Date(endTime),
    spaceId
  );
};

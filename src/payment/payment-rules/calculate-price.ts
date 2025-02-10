import { RuleType } from "@prisma/client";
import { differenceInMinutes } from "date-fns";
import { HttpError } from "wasp/server";
import type { GetReservationPrice } from "wasp/server/operations";
import { stripe } from "../stripe/stripeClient";
import { WireSafePaymentRule } from "./operations";

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

const calculatePriceFromRules = (
  startTime: Date,
  endTime: Date,
  rules: WireSafePaymentRule[],
  tags: string[] = []
): PriceBreakdownResponse => {
  const breakdown: PriceBreakdownResponse = {
    basePrice: 0,
    multipliers: [],
    discounts: [],
    finalPrice: 0,
  };

  // Sort rules by priority (lower numbers first)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  const durationMinutes = differenceInMinutes(endTime, startTime);
  const dayOfWeek = startTime.getDay(); // 0-6, where 0 is Sunday
  const minutesFromMidnight = startTime.getHours() * 60 + startTime.getMinutes();

  let currentPrice = 0;

  for (const rule of sortedRules) {
    // Skip rules that don't apply to the time period
    if (rule.startTime && rule.endTime) {
      if (
        minutesFromMidnight < rule.startTime ||
        minutesFromMidnight >= rule.endTime
      ) {
        continue;
      }
    }

    // Skip rules that don't apply to the day of week
    if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(dayOfWeek)) {
      continue;
    }

    // Apply rule based on type
    switch (rule.ruleType) {
      case RuleType.BASE_RATE:
        if (rule.pricePerPeriod && rule.periodMinutes) {
          const periods = Math.ceil(durationMinutes / rule.periodMinutes);
          const price = periods * parseFloat(rule.pricePerPeriod);
          currentPrice = price;
          breakdown.basePrice = price;
        }
        break;

      case RuleType.MULTIPLIER:
        if (rule.multiplier) {
          const multiplier = parseFloat(rule.multiplier);
          currentPrice *= multiplier;
          breakdown.multipliers.push({
            reason: `Time period multiplier (${rule.startTime}-${rule.endTime})`,
            value: multiplier,
          });
        }
        break;

      case RuleType.DISCOUNT:
        if (rule.discountRate) {
          const discount = parseFloat(rule.discountRate);
          const discountAmount = currentPrice * discount;
          currentPrice -= discountAmount;
          breakdown.discounts.push({
            reason: "Duration discount",
            value: discount,
          });
        }
        break;
    }
  }

  breakdown.finalPrice = currentPrice;
  return breakdown;
};

export const getReservationPrice: GetReservationPrice< { reservationId: string }, GetReservationPriceResponse> = async ({reservationId}, context) => {
  if (!context.user) {
    throw new HttpError(401, "Not authenticated");
  }

  // Get reservation details
  const reservation = await context.entities.Reservation.findUnique({
    where: { id: reservationId },
    include: {
      space: {
        include: {
          venue: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new HttpError(404, "Reservation not found");
  }

  // Get venue payment rules
  const paymentRules = await context.entities.PaymentRule.findMany({
    where: {
      venueId: reservation.space.venue.id,
      OR: [
        { spaceIds: { isEmpty: true } }, // Venue-wide rules
        { spaceIds: { has: reservation.space.id } }, // Space-specific rules
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
    conditions: rule.conditions.map(condition => ({
      ...condition,
      startTime: condition.startTime || null,
      endTime: condition.endTime|| null,
      userTags: condition.userTags || [],
    })),
  }));

  // Calculate price
  const priceBreakdown = calculatePriceFromRules(
    reservation.startTime,
    reservation.endTime,
    wireSafeRules
  );

  if (priceBreakdown.finalPrice <= 0) {
    throw new HttpError(400, "Could not calculate a valid price for reservation");
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
            description: `Reservation from ${reservation.startTime.toLocaleString()} to ${reservation.endTime.toLocaleString()}`,
          },
          unit_amount: Math.round(priceBreakdown.finalPrice * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      reservationId: reservation.id,
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
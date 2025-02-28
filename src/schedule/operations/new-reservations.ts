import { PaymentRule, Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { localToUTC } from "../calendar/date-utils";

function calculateBaseRate(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
): number {
  if (!rule.pricePerPeriod || !rule.periodMinutes) {
    return 0; // No pricing rule set, assume free
  }

  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000; // Convert ms to minutes
  const periods = Math.ceil(durationMinutes / rule.periodMinutes); // Round up to ensure full coverage

  return periods * parseFloat(rule.pricePerPeriod.toString()); // Ensure correct decimal handling
}

function isRuleApplicable(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
): boolean {
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if rule is within the time range
  const withinTimeRange =
    (!rule.startTime || startMinutes >= rule.startTime) &&
    (!rule.endTime || endMinutes <= rule.endTime);

  // Check if rule applies to this day of the week
  const appliesToDay = !rule.daysOfWeek || rule.daysOfWeek.includes(dayOfWeek);

  return withinTimeRange && appliesToDay;
}

export function getStartEndTime(start: Date, end: Date, venue?: Venue) {
  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  const startTime = localToUTC(new Date(start), venue);
  startTime.setSeconds(0, 0);
  const endTime = localToUTC(new Date(end), venue);
  endTime.setSeconds(0, 0);

  if (startTime >= endTime) {
    throw new HttpError(400, "Start time must be before end time");
  }

  return { startTime, endTime };
}

export function runPaymentRules(
  paymentRules: PaymentRule[],
  startTime: Date,
  endTime: Date,
  spaceId: string,
): { requiresPayment: boolean; totalCost: number } {
  // If there are no payment rules, no payment is required
  if (!paymentRules || paymentRules.length === 0) {
    return { requiresPayment: false, totalCost: 0 };
  }

  const rules = paymentRules
    .filter(
      (rule) => rule.spaceIds.length === 0 || rule.spaceIds.includes(spaceId),
    )
    .sort((a, b) => a.priority - b.priority); // Apply lower priority firstl

  let totalCost = 0;
  let requiresPayment = false;

  for (const rule of rules) {
    if (isRuleApplicable(rule, startTime, endTime)) {
      switch (rule.ruleType) {
        case "BASE_RATE":
          totalCost += calculateBaseRate(rule, startTime, endTime);
          requiresPayment = true;
          break;
        case "MULTIPLIER":
          totalCost *= rule.multiplier?.toNumber() ?? 1;
          break;
        case "DISCOUNT":
          totalCost -= totalCost * (rule.discountRate?.toNumber() ?? 0);
          break;
        case "FLAT_FEE":
          totalCost += rule.pricePerPeriod?.toNumber() ?? 0;
          requiresPayment = true;
          break;
      }
    }
  }

  return { requiresPayment, totalCost };
}

export async function checkIfPaymentRequired(
  space: Space & { venue: Venue & { paymentRules: PaymentRule[] } },
  startTime: Date,
  endTime: Date,
): Promise<{ requiresPayment: boolean; totalCost: number }> {
  return runPaymentRules(
    space.venue.paymentRules,
    startTime,
    endTime,
    space.id,
  );
}

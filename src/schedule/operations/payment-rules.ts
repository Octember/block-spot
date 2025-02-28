import { PaymentRule } from 'wasp/entities';
import { Decimal } from 'decimal.js';

function calculateBaseRate(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
): number {
  if (!rule.pricePerPeriod || !rule.periodMinutes) {
    return 0; // No pricing rule set, assume free
  }

  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000; // Convert ms to minutes
  if (durationMinutes <= 0) {
    return 0; // Handle zero or negative durations
  }

  const periods = Math.ceil(durationMinutes / rule.periodMinutes); // Round up to ensure full coverage
  return periods * rule.pricePerPeriod.toNumber(); // Use Decimal's toNumber for consistent precision
}

function isRuleApplicable(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
): boolean {
  // Prevent negative durations
  if (endTime < startTime) {
    return false;
  }

  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if rule is within the time range
  const withinTimeRange =
    (!rule.startTime || startMinutes >= rule.startTime) &&
    (!rule.endTime || endMinutes <= rule.endTime);

  // Check if rule applies to this day of the week
  const appliesToDay = !rule.daysOfWeek || rule.daysOfWeek.length === 0 || rule.daysOfWeek.includes(dayOfWeek);

  return withinTimeRange && appliesToDay;
}

export function runPaymentRules(
  paymentRules: PaymentRule[],
  startTime: Date,
  endTime: Date,
  spaceId: string,
): { requiresPayment: boolean; totalCost: number } {
  // Handle invalid time ranges
  if (endTime < startTime) {
    console.log("Invalid time range: end time is before start time");
    return { requiresPayment: false, totalCost: 0 };
  }

  if (!paymentRules || paymentRules.length === 0) {
    console.log("No payment rules available. Payment is not required.");
    return { requiresPayment: false, totalCost: 0 };
  }

  // Filter rules for the specific space and sort by priority (lower first)
  const rules = paymentRules
    .filter(rule => rule.spaceIds.length === 0 || rule.spaceIds.includes(spaceId))
    .sort((a, b) => a.priority - b.priority);

  let totalCost = new Decimal(0);
  let requiresPayment = false;
  let baseRateApplied = false;

  for (const rule of rules) {
    if (!isRuleApplicable(rule, startTime, endTime)) {
      console.log(`Skipping rule ${rule.id} (type: ${rule.ruleType}) as it is not applicable.`);
      continue;
    }
    console.log(`Processing rule ${rule.id} (type: ${rule.ruleType}).`);

    switch (rule.ruleType) {
      case "BASE_RATE":
        if (!baseRateApplied) {
          const baseCost = calculateBaseRate(rule, startTime, endTime);
          totalCost = totalCost.plus(baseCost);
          // Only mark payment if the base cost is non-zero
          if (baseCost !== 0) {
            requiresPayment = true;
          }
          baseRateApplied = true;
          console.log(`Applied BASE_RATE rule ${rule.id}: base cost = ${baseCost}, totalCost = ${totalCost}`);
        } else {
          console.log(`Skipping BASE_RATE rule ${rule.id} because a base rate has already been applied.`);
        }
        break;
      case "MULTIPLIER": {
        const multiplier = rule.multiplier?.toNumber() ?? 1;
        totalCost = totalCost.times(multiplier);
        console.log(`Applied MULTIPLIER rule ${rule.id}: multiplier = ${multiplier}, totalCost = ${totalCost}`);
        break;
      }
      case "DISCOUNT": {
        const discount = rule.discountRate?.toNumber() ?? 0;
        const discountAmount = totalCost.times(discount);
        totalCost = totalCost.minus(discountAmount);
        console.log(`Applied DISCOUNT rule ${rule.id}: discount = ${discount}, discountAmount = ${discountAmount}, totalCost = ${totalCost}`);
        break;
      }
      case "FLAT_FEE": {
        const fee = rule.pricePerPeriod?.toNumber() ?? 0;
        if (fee !== 0) {
          totalCost = totalCost.plus(fee);
          requiresPayment = true;
          console.log(`Applied FLAT_FEE rule ${rule.id}: fee = ${fee}, totalCost = ${totalCost}`);
        } else {
          console.log(`FLAT_FEE rule ${rule.id} has fee 0. Not marking payment as required.`);
        }
        break;
      }
      default:
        console.log(`Unknown rule type for rule ${rule.id}: ${rule.ruleType}`);
        break;
    }
  }

  // If the final total cost is zero, ensure payment is not required.
  if (totalCost.isZero()) {
    console.log("Final total cost is 0. Payment is not required.");
    requiresPayment = false;
  }

  // Round to 2 decimal places for currency
  const finalCost = totalCost.toDecimalPlaces(2).toNumber();
  console.log(`Final calculation: requiresPayment = ${requiresPayment}, totalCost = ${finalCost}`);
  return { requiresPayment, totalCost: finalCost };
}

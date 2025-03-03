import { PaymentRule } from "wasp/entities";

export function calculateBaseRate(
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

import Decimal from "decimal.js";
import { PaymentRule } from "wasp/entities";

export const RULE_TYPES = [
  { label: "per time period", value: "BASE_RATE" },
  { label: "fixed rate", value: "FLAT_FEE" },
];

export const DURATION_FILTER_OPTIONS = [
  { label: "at least", value: "minMinutes" },
  { label: "at most", value: "maxMinutes" },
];

export function defaultPaymentRule(venueId: string, priority?: number): PaymentRule {
  return {
    id: "",
    venueId,
    spaceIds: [],
    priority: priority || 0,
    ruleType: "FLAT_FEE",
    pricePerPeriod: new Decimal(10.0),
    periodMinutes: null,
    multiplier: null,
    discountRate: null,
    startTime: null,
    endTime: null,
    daysOfWeek: [],
    requiredTags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    minMinutes: 30,
    maxMinutes: null,
  };
}

export const PeriodOptions = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
  { label: "5 hours", value: 300 },
  { label: "6 hours", value: 360 },
  { label: "7 hours", value: 420 },
  { label: "8 hours", value: 480 },
];

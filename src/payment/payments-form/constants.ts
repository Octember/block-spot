import Decimal from 'decimal.js';
import { PaymentRule } from 'wasp/entities';


export const RULE_TYPES = [
  { label: "Base rate", value: "BASE_RATE" },
  { label: "Flat fee", value: "FLAT_FEE" },
]

export function defaultPaymentRule(venueId: string): PaymentRule {
  return {
    id: "",
    venueId,
    spaceIds: [],
    priority: 0,
    ruleType: "FLAT_FEE",
    pricePerPeriod: new Decimal(10.0),
    multiplier: null,
    discountRate: null,
    startTime: null,
    endTime: null,
    daysOfWeek: [],
    requiredTags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

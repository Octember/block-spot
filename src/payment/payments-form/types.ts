import { PaymentRule, PriceCondition } from "wasp/entities";

export type PaymentRoleFormInput = Pick<
  PaymentRule,
  "priority" | "ruleType" | "pricePerPeriod" | "periodMinutes" | "startTime" | "endTime" | "daysOfWeek"
> & {
  conditions: PriceConditionFormInput[]
};

export type PriceConditionFormInput = {
  type: 'duration';
  durationFilter: 'startTime' | 'endTime';
  durationValue: number;
} | {
  type: 'userTags';
  userTags: string[];
}

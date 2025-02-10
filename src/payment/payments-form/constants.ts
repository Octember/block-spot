import Decimal from "decimal.js";
import { PaymentRoleFormInput } from "./types";
import {
  WireSafePaymentRule,
  PaymentRuleInput,
} from "../payment-rules/operations";
import { assertUnreachable } from "../../shared/utils";

export const RULE_TYPES = [
  { label: "per time period", value: "BASE_RATE" },
  { label: "fixed rate", value: "FLAT_FEE" },
];

export const CONDITION_FILTER_OPTIONS = [
  { label: "The booking's duration is", value: "duration" },
  // { label: "The user's tags are", value: "userTags" },
];

export const DURATION_FILTER_OPTIONS = [
  { label: "at least", value: "startTime" },
  { label: "at most", value: "endTime" },
];

export function defaultPaymentRule(priority?: number): PaymentRoleFormInput {
  return {
    priority: priority || 0,
    ruleType: "FLAT_FEE",
    pricePerPeriod: new Decimal(10.0),
    periodMinutes: null,
    startTime: null,
    endTime: null,
    daysOfWeek: [],
    conditions: [
      {
        type: "duration",
        durationFilter: "startTime",
        durationValue: 60,
      },
    ],
  };
}

export function toFormInput(
  paymentRule: WireSafePaymentRule,
): PaymentRoleFormInput {
  return {
    priority: paymentRule.priority,
    ruleType: paymentRule.ruleType,
    pricePerPeriod: new Decimal(paymentRule.pricePerPeriod || 0),
    periodMinutes: paymentRule.periodMinutes,
    startTime: paymentRule.startTime,
    endTime: paymentRule.endTime,
    daysOfWeek: paymentRule.daysOfWeek,
    conditions: (paymentRule.conditions || []).map((condition) => {
      if (condition.startTime) {
        return {
          type: "duration",
          durationFilter: "startTime",
          durationValue: condition.startTime,
        };
      } else if (condition.endTime) {
        return {
          type: "duration",
          durationFilter: "endTime",
          durationValue: condition.endTime,
        };
      } else if (condition.userTags) {
        return {
          type: "userTags",
          userTags: condition.userTags,
        };
      }

      throw new Error(`Unknown condition type: ${condition}`);
    }),
  };
}

export function toApiInput(rule: PaymentRoleFormInput): PaymentRuleInput {
  return {
    ...rule,
    periodMinutes: Number(rule.periodMinutes) || 0,
    pricePerPeriod: rule.pricePerPeriod?.toString() || undefined,
    startTime: rule.startTime || undefined,
    endTime: rule.endTime || undefined,
    daysOfWeek: rule.daysOfWeek || [],
    spaceIds: [],
    conditions: rule.conditions.map((condition) => {
      switch (condition.type) {
        case "duration":
          if (condition.durationFilter === "startTime") {
            return {
              startTime: Number(condition.durationValue) || 0,
            };
          } else {
            return {
              endTime: Number(condition.durationValue) || 0,
            };
          }
        case "userTags":
          return {
            userTags: condition.userTags || [],
          };
        default:
          assertUnreachable(condition);
      }
    }),
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

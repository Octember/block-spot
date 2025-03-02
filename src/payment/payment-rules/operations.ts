import { RuleType } from "@prisma/client";
import { PaymentRule, PriceCondition } from "wasp/entities";
import { HttpError } from "wasp/server";
import type {
  GetVenuePaymentRules,
  UpdatePaymentRules,
} from "wasp/server/operations";
import { PriceConditionFormInput } from "../payments-form/types";

export type WireSafePaymentRule = Omit<
  PaymentRule,
  "pricePerPeriod" | "multiplier" | "discountRate"
> & {
  pricePerPeriod: string | null;
  multiplier: string | null;
  discountRate: string | null;
  conditions: Pick<PriceCondition, "startTime" | "endTime" | "userTags">[];
};

export type PaymentRuleInput = {
  id?: string;
  spaceIds: string[];
  priority: number;
  ruleType: RuleType;
  pricePerPeriod?: string;
  periodMinutes?: number;
  startTime?: number;
  endTime?: number;
  daysOfWeek: number[];
  conditions: {
    startTime?: number;
    endTime?: number;
    userTags?: string[];
  }[];
};

type UpdatePaymentRulesArgs = {
  venueId: string;
  rules: PaymentRuleInput[];
};

// Helper function to validate a set of payment rules
const validatePaymentRules = (rules: PaymentRuleInput[]) => {
  // Check for base rate rule
  // const hasBaseRate = rules.some(rule => rule.ruleType === 'BASE_RATE');
  // if (!hasBaseRate) {
  //   throw new Error('At least one BASE_RATE rule is required');
  // }

  // Check for unique priorities
  const priorities = rules.map((rule) => rule.priority);
  const uniquePriorities = new Set(priorities);
  if (priorities.length !== uniquePriorities.size) {
    throw new Error("Each rule must have a unique priority");
  }

  // Validate individual rules
  rules.forEach((rule) => {
    // Validate required fields based on rule type
    switch (rule.ruleType) {
      case "BASE_RATE":
        if (!rule.pricePerPeriod || !rule.periodMinutes) {
          throw new Error(
            "BASE_RATE rules require pricePerPeriod and periodMinutes",
          );
        }
        break;
      // case "MULTIPLIER":
      //   if (!rule.multiplier) {
      //     throw new Error("MULTIPLIER rules require a multiplier value");
      //   }
      //   break;
      // case "DISCOUNT":
      //   if (!rule.discountRate) {
      //     throw new Error("DISCOUNT rules require a discountRate");
      //   }
      //   if (rule.discountRate <= 0 || rule.discountRate >= 1) {
      //     throw new Error("Discount rate must be between 0 and 1");
      //   }
      // break;
    }

    // Validate time ranges if specified
    if (rule.startTime !== undefined && rule.endTime !== undefined) {
      if (rule.startTime < 0 || rule.startTime > 1439) {
        throw new Error("startTime must be between 0 and 1439");
      }
      if (rule.endTime < 0 || rule.endTime > 1439) {
        throw new Error("endTime must be between 0 and 1439");
      }
      if (rule.startTime >= rule.endTime) {
        throw new Error("startTime must be before endTime");
      }
    }

    // Validate days of week
    if (rule.daysOfWeek.some((day) => day < 0 || day > 6)) {
      throw new Error("Days of week must be between 0 and 6");
    }
  });
};

export const updatePaymentRules: UpdatePaymentRules<
  UpdatePaymentRulesArgs,
  void
> = async ({ venueId, rules }, context) => {
  if (!context.user) {
    console.log(
      `[PAYMENT_RULES] Unauthorized attempt to update rules for venue ${venueId}`,
    );
    throw new HttpError(401, "Not authenticated");
  }

  // Check if user has access to this venue
  const venue = await context.entities.Venue.findFirst({
    where: {
      id: venueId,
      organization: {
        users: {
          some: {
            userId: context.user.id,
            role: "OWNER",
          },
        },
      },
    },
  });

  if (!venue) {
    console.log(
      `[PAYMENT_RULES] Non-owner user ${context.user.id} attempted to update rules for venue ${venueId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to update payment rules for this venue",
    );
  }

  try {
    console.log(
      `[PAYMENT_RULES] Validating ${rules.length} rules for venue ${venueId}`,
    );
    // Validate rules before making any changes
    validatePaymentRules(rules);

    // Get existing rules for the venue
    const existingRules = await context.entities.PaymentRule.findMany({
      where: { venueId },
    });

    // Create sets for efficient lookup
    const existingRuleIds = new Set(existingRules.map((rule) => rule.id));
    const newRuleIds = new Set(rules.filter((r) => r.id).map((r) => r.id));

    // Find rules to delete (exist in DB but not in new rules)
    const rulesToDelete = existingRules.filter(
      (rule) => !newRuleIds.has(rule.id),
    );
    const rulesToUpdate = rules.filter(
      (rule) => rule.id && existingRuleIds.has(rule.id),
    );
    const rulesToCreate = rules.filter((rule) => !rule.id);

    console.log(
      `[PAYMENT_RULES] Venue ${venueId}: Deleting ${rulesToDelete.length}, Updating ${rulesToUpdate.length}, Creating ${rulesToCreate.length} rules`,
    );

    // Start a transaction to ensure all operations succeed or fail together
    // Delete rules that are no longer needed
    if (rulesToDelete.length > 0) {
      await context.entities.PaymentRule.deleteMany({
        where: {
          id: {
            in: rulesToDelete.map((rule) => rule.id),
          },
        },
      });
    }

    // Update existing rules
    for (const rule of rulesToUpdate) {
      console.log(
        `[PAYMENT_RULES] Updating rule ${rule.id} (type: ${rule.ruleType}, priority: ${rule.priority})`,
      );
      await context.entities.PaymentRule.update({
        where: { id: rule.id },
        data: {
          spaceIds: rule.spaceIds,
          priority: rule.priority,
          ruleType: rule.ruleType,
          pricePerPeriod: rule.pricePerPeriod,
          periodMinutes: rule.periodMinutes,
          startTime: rule.startTime,
          endTime: rule.endTime,
          daysOfWeek: rule.daysOfWeek,
          conditions: {
            deleteMany: {}, // Delete all existing conditions
            create: rule.conditions.map((condition) => ({
              startTime: condition.startTime,
              endTime: condition.endTime,
              userTags: condition.userTags || [],
            })),
          },
        },
      });
    }

    // Create new rules
    for (const rule of rulesToCreate) {
      console.log(
        `[PAYMENT_RULES] Creating new rule (type: ${rule.ruleType}, priority: ${rule.priority})`,
      );
      await context.entities.PaymentRule.create({
        data: {
          venueId,
          spaceIds: rule.spaceIds,
          priority: rule.priority,
          ruleType: rule.ruleType,
          pricePerPeriod: rule.pricePerPeriod,
          periodMinutes: rule.periodMinutes,
          startTime: rule.startTime,
          endTime: rule.endTime,
          daysOfWeek: rule.daysOfWeek,
          conditions: {
            create: rule.conditions.map((condition) => ({
              startTime: condition.startTime,
              endTime: condition.endTime,
              userTags: condition.userTags || [],
            })),
          },
        },
      });
    }
  } catch (error) {
    console.log(
      `[PAYMENT_RULES] Error updating rules for venue ${venueId}:`,
      error,
    );
    throw new HttpError(
      400,
      error instanceof Error ? error.message : "Failed to update payment rules",
    );
  }
};

export const getVenuePaymentRules: GetVenuePaymentRules<
  { venueId: string },
  WireSafePaymentRule[]
> = async ({ venueId }, context) => {
  if (!context.user) {
    console.log(
      `[PAYMENT_RULES] Unauthorized attempt to view rules for venue ${venueId}`,
    );
    throw new HttpError(401, "Not authenticated");
  }

  const venue = await context.entities.Venue.findFirst({
    where: {
      id: venueId,
      organization: {
        users: {
          some: {
            userId: context.user.id,
          },
        },
      },
    },
  });

  if (!venue) {
    console.log(
      `[PAYMENT_RULES] User ${context.user.id} attempted to view rules for unauthorized venue ${venueId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to view payment rules for this venue",
    );
  }

  console.log(`[PAYMENT_RULES] Fetching rules for venue ${venueId}`);

  const paymentRules = await context.entities.PaymentRule.findMany({
    where: { venueId },
    include: {
      conditions: true,
    },
    orderBy: { priority: "asc" },
  });

  return paymentRules.map((rule) => ({
    ...rule,
    pricePerPeriod: rule.pricePerPeriod ? rule.pricePerPeriod.toString() : null,
    multiplier: rule.multiplier ? rule.multiplier.toString() : null,
    discountRate: rule.discountRate ? rule.discountRate.toString() : null,
  }));
};

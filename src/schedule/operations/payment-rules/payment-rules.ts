import { Decimal } from "decimal.js";
  import { PaymentRule as BasePaymentRule, PriceCondition, OrganizationTag } from "wasp/entities";
import { RuleApplicabilityResult } from "./price-conditions";
import { isPriceConditionApplicable } from "./price-conditions";
import { calculateBaseRate } from "./rates";
import { PrismaClient } from "@prisma/client";

// Define a more complete PaymentRule type that includes the conditions field
type PaymentRule = BasePaymentRule & {
  conditions: PriceCondition[];
};

async function getUserTags(
  userId: string,
  spaceId: string,
  db: {
    space: PrismaClient["space"];
    organizationUser: PrismaClient["organizationUser"];
  },
  ): Promise<OrganizationTag[]> {
  // Step 1: Find the space and its associated venue and organization
  const space = await db.space.findUnique({
    where: { id: spaceId },
    include: {
      venue: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!space || !space.venue || !space.venue.organization) {
    console.warn(`Space not found or has incomplete data: ${spaceId}`);
    return [];
  }

  const organizationId = space.venue.organization.id;

  // Step 2: Find the organization user record that connects the user to this organization
  const organizationUser = await db.organizationUser.findFirst({
    where: {
      userId: userId,
      organizationId: organizationId,
    },
    include: {
      // Include the tags associated with this organization user
      tags: {
        include: {
          organizationTag: true,
        },
      },
    },
  });

  if (!organizationUser) {
    console.warn(
      `User ${userId} is not a member of the organization ${organizationId} that owns space ${spaceId}`,
    );
    return [];
  }

  // Step 3: Extract all tag names from the organizationUser's tags
  const tags = organizationUser.tags.map((tag) => tag.organizationTag);

  return tags;
}

function isRuleApplicable(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
  userTags: string[] = [],
): RuleApplicabilityResult {
  // Prevent negative durations
  if (endTime < startTime) {
    return {
      applicable: false,
      reason: "Invalid time range: end time is before start time",
    };
  }

  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if rule is within the time range
  const withinTimeRange =
    (!rule.startTime || startMinutes >= rule.startTime) &&
    (!rule.endTime || endMinutes <= rule.endTime);

  if (!withinTimeRange) {
    return {
      applicable: false,
      reason: `Booking time range (${startMinutes}-${endMinutes} minutes) is outside rule time constraints (${rule.startTime || "any"}-${rule.endTime || "any"} minutes)`,
    };
  }

  // Check if rule applies to this day of the week
  const appliesToDay =
    !rule.daysOfWeek ||
    rule.daysOfWeek.length === 0 ||
    rule.daysOfWeek.includes(dayOfWeek);

  if (!appliesToDay) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return {
      applicable: false,
      reason: `Booking day (${dayNames[dayOfWeek]}) not included in rule days [${rule.daysOfWeek?.map((d) => dayNames[d]).join(", ")}]`,
    };
  }

  // If there are no conditions, rule is applicable
  if (!rule.conditions || rule.conditions.length === 0) {
    return {
      applicable: true,
      reason: "Basic rule criteria met with no additional conditions",
    };
  }

  // Check if any condition applies (ANY match makes the rule applicable)
  const applicableConditions = rule.conditions
    .map((condition) =>
      isPriceConditionApplicable(condition, startTime, userTags),
    )
    .filter((result) => {
      if (!result.applicable) {
        console.log("Condition skipped because", result.reason);
      }
      return result.applicable;
    });

  if (applicableConditions.length > 0) {
    return {
      applicable: true,
      reason: `Matched ${applicableConditions.length} of ${rule.conditions.length} conditions`,
    };
  }

  const conditionStrings = rule.conditions
    .map((c) => {
      const timeRange =
        c.startTime !== null && c.endTime !== null
          ? `${c.startTime}-${c.endTime}`
          : "any";
      const userTags =
        c.userTags.length > 0 ? `[${c.userTags.join(", ")}]` : "any";

      const str = {
        timeRange,
        userTags,
      };
      return JSON.stringify(str);
    })
    .join(", ");

  // None of the conditions matched
  return {
    applicable: false,
    reason: `None of the rule conditions were met: ${conditionStrings}`,
  };
}

// Define a new type for price breakdown items
export type PriceBreakdownItem = {
  ruleId: string;
  ruleType: string;
  description: string;
  amount: number;
  appliedAt: Date;
  reason?: string;
};

export type PriceBreakdown = {
  baseRate?: PriceBreakdownItem;
  fees: PriceBreakdownItem[];
  discounts: PriceBreakdownItem[];
  multipliers: PriceBreakdownItem[];
  subtotal: number;
  total: number;
};

export type PaymentRulesResult = {
  requiresPayment: boolean;
  totalCost: number;
  priceBreakdown?: PriceBreakdown;
  skipReasons?: string[];
};

export async function calculatePaymentRulesV2({
  rules,
  startTime,
  endTime,
  userId,
  spaceId,
  db,
}: {
  rules: PaymentRule[],
  startTime: Date,
  endTime: Date,
  spaceId: string,
  userId: string,
  db: {
    organizationUser: PrismaClient["organizationUser"];
    space: PrismaClient["space"];
  };
}): Promise<PaymentRulesResult> {
  const userTags = await getUserTags(userId, spaceId, db);

  console.log(`[V2] Calculating payment rules for space ${spaceId} with user tags [${userTags.map((tag) => tag.name).join(", ")}]`);

  return calculatePaymentRules(rules, startTime, endTime, spaceId, userTags.map((tag) => tag.id));
}

export function calculatePaymentRules(
  paymentRules: PaymentRule[],
  startTime: Date,
  endTime: Date,
  spaceId: string,
  userTags: string[],
): PaymentRulesResult {
  // Handle invalid time ranges
  if (endTime < startTime) {
    console.log("Invalid time range: end time is before start time");
    return {
      requiresPayment: false,
      totalCost: 0,
      skipReasons: ["Invalid time range: end time is before start time"],
    };
  }

  if (!paymentRules || paymentRules.length === 0) {
    console.log("No payment rules available. Payment is not required.");
    return {
      requiresPayment: false,
      totalCost: 0,
      skipReasons: ["No payment rules available"],
    };
  }

  // Filter rules for the specific space and sort by priority (lower first)
  const rules = paymentRules
    .filter(
      (rule) => rule.spaceIds.length === 0 || rule.spaceIds.includes(spaceId),
    )
    .sort((a, b) => a.priority - b.priority);

  let totalCost = new Decimal(0);
  let requiresPayment = false;
  let baseRateApplied = false;

  // Create breakdown structure
  const breakdown: PriceBreakdown = {
    fees: [],
    discounts: [],
    multipliers: [],
    subtotal: 0,
    total: 0,
  };

  for (const rule of rules) {
    const applicabilityResult = isRuleApplicable(
      rule,
      startTime,
      endTime,
      userTags,
    );
    if (!applicabilityResult.applicable) {
      console.log(
        `Skipping rule ${rule.id} (type: ${rule.ruleType}, rate: ${rule.pricePerPeriod?.toFixed(2)}) as it is not applicable. Reason: ${applicabilityResult.reason}`,
      );

      continue;
    }
    console.log(`Processing rule ${rule.id} (type: ${rule.ruleType}).`);

    switch (rule.ruleType) {
      case "BASE_RATE":
        if (!baseRateApplied) {
          const baseCost = calculateBaseRate(rule, startTime, endTime);
          totalCost = totalCost.plus(baseCost);

          // Add to breakdown
          if (baseCost !== 0) {
            const durationMinutes =
              (endTime.getTime() - startTime.getTime()) / 60000;
            const periods = Math.ceil(
              durationMinutes / (rule.periodMinutes || 1),
            );

            breakdown.baseRate = {
              ruleId: rule.id,
              ruleType: rule.ruleType,
              description: `Base rate (${periods} × ${rule.periodMinutes} min @ $${rule.pricePerPeriod?.toFixed(2)})`,
              amount: baseCost,
              appliedAt: new Date(),
              reason: applicabilityResult.reason,
            };
            breakdown.subtotal = baseCost;

            // Only mark payment if the base cost is non-zero
            requiresPayment = true;
          }
          baseRateApplied = true;
          console.log(
            `Applied BASE_RATE rule ${rule.id}: base cost = ${baseCost}, totalCost = ${totalCost}`,
          );
        } else {
          console.log(
            `Skipping BASE_RATE rule ${rule.id} because a base rate has already been applied.`,
          );
        }
        break;
      case "MULTIPLIER": {
        const multiplier = rule.multiplier?.toNumber() ?? 1;
        const beforeMultiplier = totalCost.toNumber();
        totalCost = totalCost.times(multiplier);
        const multiplierEffect = totalCost.minus(beforeMultiplier).toNumber();

        // Add to breakdown
        breakdown.multipliers.push({
          ruleId: rule.id,
          ruleType: rule.ruleType,
          description: `Rate multiplier: ${multiplier}x`,
          amount: multiplierEffect,
          appliedAt: new Date(),
          reason: applicabilityResult.reason,
        });

        console.log(
          `Applied MULTIPLIER rule ${rule.id}: multiplier = ${multiplier}, totalCost = ${totalCost}`,
        );
        break;
      }
      case "DISCOUNT": {
        const discount = rule.discountRate?.toNumber() ?? 0;
        const discountAmount = totalCost.times(discount);
        totalCost = totalCost.minus(discountAmount);

        // Add to breakdown
        if (!discountAmount.isZero()) {
          breakdown.discounts.push({
            ruleId: rule.id,
            ruleType: rule.ruleType,
            description: `Discount: ${(discount * 100).toFixed(0)}% off`,
            amount: discountAmount.negated().toNumber(),
            appliedAt: new Date(),
            reason: applicabilityResult.reason,
          });
        }

        console.log(
          `Applied DISCOUNT rule ${rule.id}: discount = ${discount}, discountAmount = ${discountAmount}, totalCost = ${totalCost}`,
        );
        break;
      }
      case "FLAT_FEE": {
        const fee = rule.pricePerPeriod?.toNumber() ?? 0;
        if (fee !== 0) {
          totalCost = totalCost.plus(fee);

          // Add to breakdown
          breakdown.fees.push({
            ruleId: rule.id,
            ruleType: rule.ruleType,
            description: `Fee: $${fee.toFixed(2)}`,
            amount: fee,
            appliedAt: new Date(),
            reason: applicabilityResult.reason,
          });

          requiresPayment = true;
          console.log(
            `Applied FLAT_FEE rule ${rule.id}: fee = ${fee}, totalCost = ${totalCost}`,
          );
        } else {
          console.log(
            `FLAT_FEE rule ${rule.id} has fee 0. Not marking payment as required.`,
          );
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

  // Update final total in breakdown
  breakdown.total = finalCost;

  console.log(
    `Final calculation: requiresPayment = ${requiresPayment}, totalCost = ${finalCost}`,
  );

  // Only return the breakdown if there were applicable rules that affected the price
  const hasApplicableRules =
    breakdown.baseRate !== undefined ||
    breakdown.fees.length > 0 ||
    breakdown.discounts.length > 0 ||
    breakdown.multipliers.length > 0;

  const result: PaymentRulesResult = {
    requiresPayment,
    totalCost: finalCost,
    ...(hasApplicableRules ? { priceBreakdown: breakdown } : {}),
  };

  if (!requiresPayment) {
    const skipReasons: string[] = [];
    if (!baseRateApplied) {
      skipReasons.push("No base rate applied");
    }
    if (breakdown.fees.length === 0) {
      skipReasons.push("No fees applied");
    }
    if (breakdown.discounts.length === 0) {
      skipReasons.push("No discounts applied");
    }
    if (breakdown.multipliers.length === 0) {
      skipReasons.push("No multipliers applied");
    }
    result.skipReasons = skipReasons;
  }

  return result;
}

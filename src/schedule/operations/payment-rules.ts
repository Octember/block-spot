import { PaymentRule as BasePaymentRule, PriceCondition } from "wasp/entities";
import { Decimal } from "decimal.js";

// Define a more complete PaymentRule type that includes the conditions field
type PaymentRule = BasePaymentRule & {
  conditions?: PriceCondition[];
};

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

function isPriceConditionApplicable(
  condition: PriceCondition,
  startTime: Date,
  userTags: string[] = []
): boolean {
  // Check time conditions if specified
  if (condition.startTime !== null && condition.endTime !== null) {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    
    // Check if the condition time range applies to the booking start time
    if (startMinutes < condition.startTime || startMinutes > condition.endTime) {
      return false;
    }
  }
  
  // Check user tags if any are specified
  if (condition.userTags.length > 0) {
    // If no user tags are provided or user has none of the required tags, condition doesn't apply
    if (!userTags.length || !condition.userTags.some(tag => userTags.includes(tag))) {
      return false;
    }
  }
  
  // All checks passed, condition is applicable
  return true;
}

function isRuleApplicable(
  rule: PaymentRule,
  startTime: Date,
  endTime: Date,
  userTags: string[] = []
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
  const appliesToDay =
    !rule.daysOfWeek ||
    rule.daysOfWeek.length === 0 ||
    rule.daysOfWeek.includes(dayOfWeek);

  // Basic checks pass
  const basicChecksPassed = withinTimeRange && appliesToDay;
  
  // If we don't pass basic checks or there are no conditions, return basic check result
  if (!basicChecksPassed || !rule.conditions || rule.conditions.length === 0) {
    return basicChecksPassed;
  }
  
  // Check if any condition applies (ANY match makes the rule applicable)
  return rule.conditions.some(condition => 
    isPriceConditionApplicable(condition, startTime, userTags)
  );
}

// Define a new type for price breakdown items
export type PriceBreakdownItem = {
  ruleId: string;
  ruleType: string;
  description: string;
  amount: number;
  appliedAt: Date;
};

export type PriceBreakdown = {
  baseRate?: PriceBreakdownItem;
  fees: PriceBreakdownItem[];
  discounts: PriceBreakdownItem[];
  multipliers: PriceBreakdownItem[];
  subtotal: number;
  total: number;
};

export function runPaymentRules(
  paymentRules: PaymentRule[],
  startTime: Date,
  endTime: Date,
  spaceId: string,
  userTags: string[] = []
): { requiresPayment: boolean; totalCost: number; priceBreakdown?: PriceBreakdown } {
  // Handle invalid time ranges
  if (endTime < startTime) {
    console.log("Invalid time range: end time is before start time");
    return { 
      requiresPayment: false, 
      totalCost: 0
    };
  }

  if (!paymentRules || paymentRules.length === 0) {
    console.log("No payment rules available. Payment is not required.");
    return { 
      requiresPayment: false, 
      totalCost: 0
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
    total: 0
  };

  for (const rule of rules) {
    if (!isRuleApplicable(rule, startTime, endTime, userTags)) {
      console.log(
        `Skipping rule ${rule.id} (type: ${rule.ruleType}) as it is not applicable.`,
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
            const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
            const periods = Math.ceil(durationMinutes / (rule.periodMinutes || 1));
            
            breakdown.baseRate = {
              ruleId: rule.id,
              ruleType: rule.ruleType,
              description: `Base rate (${periods} × ${rule.periodMinutes} min @ $${rule.pricePerPeriod?.toNumber().toFixed(2)})`,
              amount: baseCost,
              appliedAt: new Date()
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
          appliedAt: new Date()
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
            appliedAt: new Date()
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
            appliedAt: new Date()
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
    (breakdown.baseRate !== undefined) || 
    breakdown.fees.length > 0 || 
    breakdown.discounts.length > 0 || 
    breakdown.multipliers.length > 0;

  return { 
    requiresPayment, 
    totalCost: finalCost,
    ...(hasApplicableRules ? { priceBreakdown: breakdown } : {})
  };
}

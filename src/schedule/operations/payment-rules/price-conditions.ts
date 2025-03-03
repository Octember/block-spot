import { PriceCondition } from "wasp/entities";

// Define the return type for rule applicability
export type RuleApplicabilityResult = {
  applicable: boolean;
  reason?: string;
};

export function isPriceConditionApplicable(
  condition: PriceCondition,
  startTime: Date,
  userTags: string[] = [],
): RuleApplicabilityResult {
  // Check time conditions if specified
  if (condition.startTime !== null && condition.endTime !== null) {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();

    // Check if the condition time range applies to the booking start time
    if (
      startMinutes < condition.startTime ||
      startMinutes > condition.endTime
    ) {
      return {
        applicable: false,
        reason: `Booking time (${Math.floor(startMinutes / 60)}:${String(startMinutes % 60).padStart(2, "0")}) is outside condition time range (${Math.floor(condition.startTime / 60)}:${String(condition.startTime % 60).padStart(2, "0")}-${Math.floor(condition.endTime / 60)}:${String(condition.endTime % 60).padStart(2, "0")})`,
      };
    }
  }

  // Check user tags if any are specified
  if (condition.userTags.length > 0) {

    // If no user tags are provided or user has none of the required tags, condition doesn't apply
    if (!condition.userTags.some((tag) => userTags.includes(tag))) {
      
      return {
        applicable: false,
        reason: `User tags [${userTags.join(", ")}] don't match any required tags [${condition.userTags.join(", ")}]`,
      };
    }
  }

  // All checks passed, condition is applicable
  return { applicable: true, reason: "All condition criteria met" };
}

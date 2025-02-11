import { AvailabilityRule, Venue } from "wasp/entities";

export const getUnavailabilityBlocks = (
  venue: Venue & { availabilityRules: AvailabilityRule[] },
) => {
  const unavailabilityBlocks: {
    id: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[] = [];

  // Sort rules by start time
  const sortedRules = [...venue.availabilityRules].sort(
    (a, b) => a.startTimeMinutes - b.startTimeMinutes,
  );

  if (sortedRules.length === 0) {
    return [];
  }

  // Start from venue opening if first availability doesn't start at opening
  if (
    sortedRules[0].startTimeMinutes > venue.displayStart
  ) {
    unavailabilityBlocks.push({
      id: "before-first",
      startTimeMinutes: 0,
      endTimeMinutes: sortedRules[0]?.startTimeMinutes || venue.displayEnd,
    });
  }

  // Find gaps between availability rules
  for (let i = 0; i < sortedRules.length - 1; i++) {
    const currentRule = sortedRules[i];
    const nextRule = sortedRules[i + 1];

    if (currentRule.endTimeMinutes < nextRule.startTimeMinutes) {
      unavailabilityBlocks.push({
        id: `gap-${i}`,
        startTimeMinutes: currentRule.endTimeMinutes,
        endTimeMinutes: nextRule.startTimeMinutes,
      });
    }
  }

  // Add block after last availability to closing if needed
  const lastRule = sortedRules[sortedRules.length - 1];
  if (lastRule && lastRule.endTimeMinutes <= 24 * 60) {
    unavailabilityBlocks.push({
      id: "after-last",
      startTimeMinutes: lastRule.endTimeMinutes,
      endTimeMinutes: 24 * 60,
    });
  }

  return unavailabilityBlocks;
};

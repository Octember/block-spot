import { AvailabilityRule } from 'wasp/entities';
import { FC } from 'react';
import { useTimeLabels } from './constants';
import { getSharedGridStyle } from './reservations/constants';
import { useScheduleContext } from './providers/schedule-query-provider';
import { getRowIndexFromMinutes } from './reservations/utilities';

export const AvailabilitySection: FC = () => {
  const timeLabels = useTimeLabels();
  const { venue } = useScheduleContext();

  const availabilityRules = venue.availabilityRules;

  const unavailabilityBlocks = getUnavailabilityBlocks(
    availabilityRules,
    venue.displayStart,
    venue.displayEnd,
  );


  return (
    <div {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}>
      {unavailabilityBlocks.map((rule, index) => {
        const startRow = getRowIndexFromMinutes(venue, rule.startTimeMinutes);
        const endRow = getRowIndexFromMinutes(venue, rule.endTimeMinutes);

        const rowSpan = endRow - startRow;

        return (
          <div
            key={rule.id}
            className="relative flex bg-gray-500 opacity-50 col-span-full "
            style={{
              gridRow: `${startRow} / span ${rowSpan}`,
            }}
          />
        );
      })}
    </div>
  );
};



const getUnavailabilityBlocks = (
  availabilityRules: AvailabilityRule[],
  venueStart: number,
  venueEnd: number,
) => {
  const unavailabilityBlocks = [];

  // Sort rules by start time
  const sortedRules = [...availabilityRules].sort(
    (a, b) => a.startTimeMinutes - b.startTimeMinutes,
  );

  // Start from venue opening if first availability doesn't start at opening
  if (
    sortedRules.length === 0 ||
    sortedRules[0].startTimeMinutes > venueStart
  ) {
    unavailabilityBlocks.push({
      id: "before-first",
      startTimeMinutes: 0,
      endTimeMinutes: sortedRules[0]?.startTimeMinutes || venueEnd,
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

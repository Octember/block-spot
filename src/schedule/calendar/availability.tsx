import { FC } from "react";
import { useTimeLabels } from "./constants";
import { useScheduleContext } from "./providers/schedule-query-provider";
import { getSharedGridStyle } from "./reservations/constants";
import { getRowIndexFromMinutes } from "./reservations/utilities";

export const AvailabilitySection: FC = () => {
  const timeLabels = useTimeLabels();
  const { venue, unavailabileBlocks } = useScheduleContext();

  return (
    <div {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}>
      {unavailabileBlocks.map((rule, index) => {
        const startRow = getRowIndexFromMinutes(venue, rule.startTimeMinutes);
        const endRow = getRowIndexFromMinutes(venue, rule.endTimeMinutes);

        const rowSpan = endRow - startRow;

        return (
          <div
            key={rule.id}
            className="relative flex bg-gray-500 opacity-50 col-span-full z-1"
            style={{
              gridRow: `${startRow} / span ${rowSpan}`,
            }}
          />
        );
      })}
    </div>
  );
};

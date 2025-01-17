import React, { FC, useRef } from "react";
import { AvailabilityRule, Reservation, Space, Venue } from "wasp/entities";

import { CalendarHeader } from "./calendar-header";
import { useTimeLabels } from "./constants";
import {
  getSharedGridStyle,
  MinutesPerSlot,
  PixelsPerSlot,
} from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";
import { useScheduleContext } from "./providers/schedule-query-provider";
import {
  getRowSpan,
  getRowIndex,
  getTimeFromRowIndex,
  getRowIndexFromMinutes,
} from "./reservations/utilities";

export interface WeekViewCalendarProps {
  venue: Venue & { spaces: (Space & { reservations: Reservation[] })[] };
}

export const WeekViewCalendar: FC<WeekViewCalendarProps> = ({ venue }) => {
  const containerOffset = useRef(null);
  const timeLabels = useTimeLabels();

  return (
    <div className="flex h-full flex-col flex-1">
      <CalendarHeader venue={venue} />

      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div
          style={{ width: "165%" }}
          className="flex max-w-full flex-none flex-col"
        >
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Vertical lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-300 grid sm:pr-8"
                style={{
                  gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: venue.spaces.length + 1 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className={`col-start-${index + 1} row-span-full}`}
                    />
                  ),
                )}
              </div>

              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid"
                style={{
                  gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
                }}
              >
                <div
                  ref={containerOffset}
                  className="border-b border-gray-400"
                />

                {timeLabels.map((label, index) => (
                  <React.Fragment key={index}>
                    <div className="row-span-1 border-b border-gray-200">
                      <div className="sticky left-0 z-20 -ml-14 w-14 pr-2 -my-2.5 text-right text-xs/5 text-gray-500">
                        {label}
                      </div>
                    </div>
                    {/* 30min line */}
                    {Array.from({ length: 60 / MinutesPerSlot - 1 }).map(
                      (_, index) => (
                        <div
                          key={index}
                          className={`row-span-1 border-b ${getBorderStyle(index)}`}
                        ></div>
                      ),
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Availability */}
              <AvailabilitySection />
              {/* Events */}
              <ReservationsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getBorderStyle(index: number) {
  if (index === 0) return "border-b border-gray-200";
  if (index % 2 === 0) return "border-b border-gray-300";
  return "border-b border-gray-100";
}

export const AvailabilitySection: FC = () => {
  const timeLabels = useTimeLabels();
  const { venue } = useScheduleContext();

  const availabilityRules = venue.availabilityRules;

  const unavailabilityBlocks = getUnavailabilityBlocks(
    availabilityRules,
    venue.displayStart,
    venue.displayEnd,
  );

  console.log("unavailability blocks", unavailabilityBlocks);

  return (
    <div {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}>
      {unavailabilityBlocks.map((rule, index) => {
        const startRow = getRowIndexFromMinutes(venue, rule.startTimeMinutes);
        const endRow = getRowIndexFromMinutes(venue, rule.endTimeMinutes);


        console.log("startRow", startRow, "endRow", endRow);
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

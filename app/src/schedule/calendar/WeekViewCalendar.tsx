import React, { FC, useRef } from "react";
import { Reservation, Space, Venue } from "wasp/entities";

import { CalendarHeader } from "./calendar-header";
import { useTimeLabels } from "./constants";
import { MinutesPerSlot, PixelsPerSlot } from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";

export interface WeekViewCalendarProps {
  venue: Venue & { spaces: (Space & { reservations: Reservation[] })[] };
}

export const WeekViewCalendar: FC<WeekViewCalendarProps> = ({ venue }) => {
  const containerOffset = useRef(null);
  const spaceIds = venue.spaces.map((space) => space.id);
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
                          className={`row-span-1 border-b  ${getBorderStyle(index)}`}
                        ></div>
                      ),
                    )}
                  </React.Fragment>
                ))}
              </div>

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
  if (index === 0) return "border-b border-gray-300";
  if (index % 2 === 0) return "border-b border-gray-200";
  return "border-b border-gray-100";
}

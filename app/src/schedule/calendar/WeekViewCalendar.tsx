import React, { FC, useRef } from "react";
import { Reservation, Space, Venue } from "wasp/entities";

import { AvailabilitySection } from './availability';
import { CalendarHeader } from "./calendar-header";
import { useTimeLabels } from "./constants";
import {
  MinutesPerSlot,
  PixelsPerSlot
} from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";
import { HorizontalDividers, VerticalDividers } from './dividers';
import { useScheduleContext } from "./providers/schedule-query-provider";

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
              <VerticalDividers />
              <HorizontalDividers />
              <AvailabilitySection />
              <ReservationsSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



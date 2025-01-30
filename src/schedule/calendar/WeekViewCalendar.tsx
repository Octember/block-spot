import { FC } from "react";
import { Reservation, Space, Venue } from "wasp/entities";

import { CalendarFooter } from './action-section/calendar-footer';
import { AvailabilitySection } from "./availability";
import { CalendarHeader } from "./calendar-header";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { DraftReservationProvider } from "./providers/draft-reservation-provider";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { getGridTemplateColumns } from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from './selection';

const CalendarContent: FC<WeekViewCalendarProps> = ({ venue }) => {
  return (
    <div className="flex h-full flex-col flex-1">
      <CalendarHeader />

      <div className="isolate flex flex-auto flex-col overflow-x-auto bg-white">
        <div className="flex min-w-max w-full flex-none flex-col">
          <div className="z-30 flex-none bg-white shadow sm:pr-8">
            <div
              className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
              style={{
                gridTemplateColumns: getGridTemplateColumns(
                  venue.spaces.length,
                ),
              }}
            >
              <div className="col-end-1 w-14" />
              {venue.spaces.map((space, index) => (
                <div
                  key={space.id}
                  className="flex items-center justify-center py-2"
                >
                  <span className="flex items-baseline font-medium text-gray-900">
                    {space.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-auto">
            <div className="sticky left-0 z-99 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1 ">
              <VerticalDividers />
              <HorizontalDividers />
              <AvailabilitySection />
              <ReservationsSection />
              <GridSelection />
            </div>
          </div>
        </div>
      </div>

      <CalendarFooter />
    </div>
  );
};

export interface WeekViewCalendarProps {
  venue: Venue & { spaces: (Space & { reservations: Reservation[] })[] };
}

export const WeekViewCalendar: FC<WeekViewCalendarProps> = ({ venue }) => {
  return (
    <PendingChangesProvider>
      <DraftReservationProvider>
        <SelectionProvider>
          <CalendarContent venue={venue} />
        </SelectionProvider>
      </DraftReservationProvider>
    </PendingChangesProvider>
  );
};

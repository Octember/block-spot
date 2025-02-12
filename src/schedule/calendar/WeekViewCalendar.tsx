import { FC } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { CalendarHeader } from "./calendar-header";
import {
  getUserTimeZoneAbbreviation,
  useIsTimeZoneDifferent,
  useVenueTimeZoneAbbreviation,
} from "./constants";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { ScheduleProvider } from "./providers/schedule-context-provider";
import { useVenueContext } from "./providers/venue-provider";
import { getGridTemplateColumns } from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from "./selection";

export const WeekViewCalendar: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";

  return (
    <div className="flex h-full flex-col flex-1">
      <CalendarHeader />

      <div className="isolate flex flex-auto flex-col overflow-x-auto bg-white">
        <div className="flex min-w-max w-full flex-none flex-col">
          <SpacesNamesSection />
          <div className="flex flex-auto">
            <div
              className={`sticky left-0 z-99 ${widthClass} flex-none bg-white ring-1 ring-gray-100`}
            />
            <div className="grid flex-auto grid-cols-1 grid-rows-1 ">
              <ScheduleProvider>
                <PendingChangesProvider>
                  <SelectionProvider>
                    <VerticalDividers />
                    <HorizontalDividers />
                    <AvailabilitySection />
                    <ReservationsSection />

                    <GridSelection />
                    <PendingChangesSection />
                  </SelectionProvider>
                </PendingChangesProvider>
              </ScheduleProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SpacesNamesSection: FC = () => {
  const { venue } = useVenueContext();

  return (
    <div className="z-30 flex-none bg-white shadow-4 sm:pr-8">
      <div
        className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
        style={{
          gridTemplateColumns: getGridTemplateColumns(venue.spaces.length),
        }}
      >
        <TimeZoneLabel />
        {venue.spaces.map((space) => (
          <div key={space.id} className="flex items-center justify-center py-2">
            <span className="flex items-baseline text-md font-semibold py-1 text-gray-900">
              {space.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimeZoneLabel: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";
  const venueTimeZoneAbbreviation = useVenueTimeZoneAbbreviation();

  return (
    <div className={`col-end-1 ${widthClass} flex flex-col`}>
      <div
        className={`flex-1 flex items-center ${isTimeZoneDifferent ? "justify-between" : "justify-center"} p-2`}
      >
        {isTimeZoneDifferent && (
          <span className="text-xs text-gray-500">
            {getUserTimeZoneAbbreviation()}
          </span>
        )}
        <span className="text-xs text-gray-700 font-bold">
          {venueTimeZoneAbbreviation}
        </span>
      </div>
    </div>
  );
};

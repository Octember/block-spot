import { FC } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { CalendarHeader } from "./calendar-header";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { useScheduleContext } from "./providers/schedule-context-provider";
import { getGridTemplateColumns } from "./reservations/constants";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from "./selection";

const CalendarContent: FC = () => {

  return (
    <div className="flex h-full flex-col flex-1">
      <CalendarHeader />

      <div className="isolate flex flex-auto flex-col overflow-x-auto bg-white">
        <div className="flex min-w-max w-full flex-none flex-col">
          <SpacesNamesSection />
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

      <PendingChangesSection />
    </div >
  );
};

const SpacesNamesSection: FC = () => {
  const { venue } = useScheduleContext();

  return (
    <div className="z-30 flex-none bg-white shadow-4 sm:pr-8">
      <div
        className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
        style={{
          gridTemplateColumns: getGridTemplateColumns(
            venue.spaces.length,
          ),
        }}
      >
        <div className="col-end-1 w-14" />
        {venue.spaces.map((space) => (
          <div
            key={space.id}
            className="flex items-center justify-center py-2"
          >
            <span className="flex items-baseline text-md font-semibold py-1 text-gray-900">
              {space.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WeekViewCalendar: FC = () => {
  return (
    <PendingChangesProvider>
      <SelectionProvider>
        <CalendarContent />
      </SelectionProvider>
    </PendingChangesProvider>
  );
};

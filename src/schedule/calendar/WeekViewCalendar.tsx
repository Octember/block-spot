import { FC } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { CalendarHeader, SpacesNamesSection } from './calendar-header';
import { useIsTimeZoneDifferent } from "./constants";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { ScheduleProvider } from "./providers/schedule-context-provider";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from "./selection";

export const WeekViewCalendar: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";


  return (
    <>
      <CalendarHeader />

      <div className={`flex h-full flex-col flex-1 overflow-x-scroll bg-white snap-x`}>
        <SpacesNamesSection />

        <div className="isolate flex flex-auto flex-col bg-white">
          <div className="flex min-w-max w-full flex-none flex-col">
            <div className="flex flex-auto">
              <div
                className={`sticky left-0 z-99 ${widthClass} flex-none ring-1 ring-gray-100 bg-white`}
              />
              <div className="grid flex-auto grid-cols-1 grid-rows-1">
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
    </>
  );
};

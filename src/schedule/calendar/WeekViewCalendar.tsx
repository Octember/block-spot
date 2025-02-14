import { FC } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { CalendarHeader } from './header/calendar-header';
import { SpacesNamesSection } from './header/space-names-header';
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
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1) The header is sticky at the top */}
      <CalendarHeader />

      <div className={`relative overflow-x-auto flex-1`}>
        <SpacesNamesSection />

        <div className="relative flex flex-auto flex-col bg-white">
          <div className="flex min-w-max w-full flex-none flex-col">
            <div className="flex flex-auto">
              <div
                className={`sticky left-0 z-40 ${widthClass} flex-none ring-1 ring-gray-100 bg-white`}
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
    </div>
  );
};

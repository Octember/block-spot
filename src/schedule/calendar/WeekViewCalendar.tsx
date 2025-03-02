import { FC, Fragment } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { useIsTimeZoneDifferent, useTimeLabelsAndZones } from "./constants";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { CalendarHeader } from "./header/calendar-header";
import { FloatingButtons } from "./header/scroll/scroll-to-space-buttons";
import { HorizontalScrollProvider } from "./providers/horizontal-scroll/horizontal-scroll-provider";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { ScheduleProvider } from "./providers/schedule-context-provider";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from "./selection";
import { ScrollableContainer } from "./providers/horizontal-scroll/horizontal-scroll-container";
import { MinutesPerSlot, PixelsPerSlot } from "./reservations/constants";
import { DayButtons } from './header/days-of-week';
import { SpacesNamesSection } from './header/space-names-header';

const TimeLabels: FC = () => {
  const timeLabels = useTimeLabelsAndZones();
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const labelWidthClass = isTimeZoneDifferent ? "-ml-24 w-24" : "-ml-14 w-14";

  return (
    <div
      className="col-start-1 col-end-2 row-start-1 grid"
      style={{
        gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
      }}
    >
      <div className="" />

      {timeLabels.map((label, index) => (
        <Fragment key={index}>
          {/* 15min line and label */}
          <div className={`row-span-4`}>
            <div
              className={`sticky left-0 z-40 ${labelWidthClass} pr-2 -my-2.5 text-right text-xs/5 text-gray-500 select-none`}
            >
              {label}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
};
export const WeekViewCalendar: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";

  return (
    <ScheduleProvider>
      <PendingChangesProvider>
        <SelectionProvider>
          <HorizontalScrollProvider>
            <div className="flex flex-col min-h-screen bg-white">
              {/* 1) The header is sticky at the top */}
              <div className="md:sticky top-0 inset-x-0 z-50">
                <CalendarHeader />
              </div>
              <div className="sticky top-0 md:top-12 inset-x-0 z-50">
                <DayButtons />
                <SpacesNamesSection />
              </div>

              <div className="flex flex-row">
                <div className="flex flex-col w-14 bg-white">
                  <TimeLabels />
                </div>

                <ScrollableContainer>
                  <div className="relative flex flex-auto flex-col bg-white">
                    <div className="flex min-w-max w-full flex-none flex-col">
                      <div className="flex flex-auto">
                        <div className="grid flex-auto grid-cols-1 grid-rows-1 bg-cyan-50/40">
                          <VerticalDividers />
                          <HorizontalDividers />
                          <AvailabilitySection />
                          <ReservationsSection />
                          <GridSelection />
                          <PendingChangesSection />

                          <FloatingButtons />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollableContainer>
              </div>
            </div>
          </HorizontalScrollProvider>
        </SelectionProvider>
      </PendingChangesProvider>
    </ScheduleProvider>
  );
};

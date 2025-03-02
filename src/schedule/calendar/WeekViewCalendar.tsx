import { FC, PropsWithChildren } from "react";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { CalendarHeader } from "./header/calendar-header";
import { useIsTimeZoneDifferent } from "./constants";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import { ScheduleProvider } from "./providers/schedule-context-provider";
import { ReservationsSection } from "./reservations/reservation-section";
import { GridSelection, SelectionProvider } from "./selection";
import { FloatingButtons } from './header/scroll/scroll-to-space-buttons';
import { HorizontalScrollProvider, useHorizontalScroll } from './providers/horizontal-scroll-provider';

const ScrollableContainer: FC<PropsWithChildren> = ({ children }) => {
  const { setScrolledPixels } = useHorizontalScroll();

  return (
    <div className={`relative overflow-x-auto snap-x flex-1`}
      onScroll={(e) => {
        setScrolledPixels(e.currentTarget.scrollLeft);
      }}
    >
      {children}
    </div>
  )
}

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
              <CalendarHeader />

              <ScrollableContainer>
                <div className="relative flex flex-auto flex-col bg-white">
                  <div className="flex min-w-max w-full flex-none flex-col">
                    <div className="flex flex-auto">
                      <div
                        className={`sticky left-0 z-40 ${widthClass} flex-none ring-1 ring-gray-100 bg-white`}
                      />
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
          </HorizontalScrollProvider>
        </SelectionProvider>
      </PendingChangesProvider>
    </ScheduleProvider>
  );
};



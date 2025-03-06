import { FC } from "react";
import { cn } from "../../client/cn";
import { PendingChangesSection } from "./action-section/pending-changes-section";
import { AvailabilitySection } from "./availability";
import { useIsTimeZoneDifferent } from "./constants";
import { HorizontalDividers, VerticalDividers } from "./dividers";
import { CalendarHeader } from "./header/calendar-header";
import { DayButtons } from "./header/days-of-week";
import { FloatingButtons } from "./header/scroll/scroll-to-space-buttons";
import { SpacesNamesSection } from "./header/space-names-header";
import { TimeLabels } from "./layout/time-labels";
import { PendingChangesProvider } from "./providers/pending-changes-provider";
import {
  ScheduleProvider,
  useScheduleContext,
} from "./providers/schedule-context-provider";
import { HorizontalScrollProvider } from "./providers/scroll/horizontal-scroll-provider";
import { HorizontalScrollableContainer } from "./providers/scroll/scroll-container";
import { ReservationsSection } from "./reservations/reservation-section";
import { SkeletonReservationsSection } from "./reservations/skeleton";
import { GridSelection, SelectionProvider } from "./selection";

export const WeekViewCalendar: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";

  return (
    <ScheduleProvider>
      <PendingChangesProvider>
        <SelectionProvider>
          <HorizontalScrollProvider>
            <div className="flex flex-col min-h-screen bg-white">
              {/* Sticky top*/}
              <div className="md:sticky top-0 inset-x-0 z-50">
                <CalendarHeader />
              </div>
              <div className="sticky top-0 md:top-12 inset-x-0 z-40">
                <DayButtons />
                <SpacesNamesSection />
              </div>

              <div className="flex flex-row">
                <div className="flex flex-col w-14 bg-white">
                  <TimeLabels />
                </div>

                <HorizontalScrollableContainer>
                  <div className="relative flex flex-auto flex-col bg-white">
                    <div className="flex min-w-max w-full flex-none flex-col">
                      <div className="flex flex-auto">
                        <AllContent />
                      </div>
                    </div>
                  </div>
                </HorizontalScrollableContainer>
              </div>
            </div>
          </HorizontalScrollProvider>
        </SelectionProvider>
      </PendingChangesProvider>
    </ScheduleProvider>
  );
};

const AllContent: FC = () => {
  const { isLoading } = useScheduleContext();

  return (
    <GridContainer>
      <VerticalDividers />
      <HorizontalDividers />
      <AvailabilitySection />

      {isLoading ? <SkeletonReservationsSection /> : <ReservationsSection />}

      {!isLoading && <GridSelection />}
      {!isLoading && <PendingChangesSection />}

      <FloatingButtons />
    </GridContainer>
  );
};

const GridContainer: FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className={cn("grid flex-auto grid-cols-1 grid-rows-1 bg-cyan-50/50")}>
      {children}
    </div>
  );
};

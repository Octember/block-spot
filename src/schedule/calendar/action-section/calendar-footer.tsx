import { useScheduleContext } from "../providers/schedule-query-provider";
import { PendingChangesSection } from "./pending-changes-section";

export const CalendarFooter = () => {
  // const { pendingChange } = usePendingChanges();

  return (
    <PendingChangesSection />
    // <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-16 border-gray-200 p-4">
    //   {pendingChange ? <PendingChangesSection /> : <AnnouncementSection />}
    // </div>
  );
};

export const AnnouncementSection = () => {
  const { venue } = useScheduleContext();
  return (
    <div className="flex items-center justify-center h-full">
      {venue.announcements}
    </div>
  );
};

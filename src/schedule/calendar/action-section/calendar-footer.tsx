import { usePendingChanges } from "../providers/pending-changes-provider";
import { PendingChangesSection } from "./pending-changes-section";

export const CalendarFooter = () => {
  const { pendingChange } = usePendingChanges();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-16 border-gray-200 p-4">
      {pendingChange ? <PendingChangesSection /> : <AnnouncementSection />}
    </div>
  );
};

export const AnnouncementSection = () => {
  return (
    <div className="flex items-center justify-center h-full">
      Announcements - studio will be closed on Monday
    </div>
  );
};

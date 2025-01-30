import { format } from 'date-fns';
import { usePendingChanges } from '../providers/pending-changes-provider';
import { PendingChangesSection } from './pending-changes-section';

export const ChangeDescription = () => {
  const { pendingChange } = usePendingChanges();

  if (!pendingChange) return '';

  const formatTime = (date: Date) => format(date, 'h:mm a');
  const timeRange = `${formatTime(pendingChange.newState.startTime)} - ${formatTime(pendingChange.newState.endTime)}`;

  switch (pendingChange.type) {
    case 'CREATE':
      return `Create reservation for ${timeRange}`;
    case 'UPDATE':
      if (pendingChange.oldState) {
        const oldTimeRange = `${formatTime(pendingChange.oldState.startTime)} - ${formatTime(pendingChange.oldState.endTime)}`;
        if (oldTimeRange !== timeRange) {
          return `Move reservation from ${oldTimeRange} to ${timeRange}`;
        }
        if (pendingChange.oldState.spaceId !== pendingChange.newState.spaceId) {
          return `Move reservation at ${timeRange} to different space`;
        }
        return `Update reservation at ${timeRange}`;
      }
      return `Update reservation for ${timeRange}`;
    case 'DELETE':
      return `Delete reservation at ${timeRange}`;
    default:
      return 'Unknown change';
  }
};

export const CalendarFooter = () => {
  const { pendingChange } = usePendingChanges();


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-16 border-gray-200 p-4">
      {pendingChange ? <PendingChangesSection /> : <AnnouncementSection />}
    </div>
  );
};

export const AnnouncementSection = () => {
  // const { pendingChange } = usePendingChanges();

  // if (!pendingChange) return null;

  return <div className='flex items-center justify-center h-full'>
    Announcements - studio will be closed on Monday
  </div>
};
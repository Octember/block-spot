import { format } from 'date-fns';
import { Button } from '../../../client/components/button';
import { usePendingChanges } from '../providers/pending-changes-provider';

export const CalendarFooter = () => {
  const { pendingChange, hasPendingChange, applyChange, cancelChange } = usePendingChanges();

  // if (!hasPendingChange) return null;

  const getChangeDescription = () => {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 mx-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              Pending Change
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {getChangeDescription()}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={cancelChange}
            ariaLabel="Cancel Change"
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={applyChange}
            ariaLabel="Apply Change"
            variant="primary"
          >
            Apply Change
          </Button>
        </div>
      </div>
    </div>
  );
};
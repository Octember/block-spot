import { Button } from '../../../client/components/button';
import { usePendingChanges } from '../providers/pending-changes-provider';
import { ChangeDescription } from './calendar-footer';

export const PendingChangesSection = () => {
  const { cancelChange, applyChange } = usePendingChanges();

  return (
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2" />
          <span className="text-xl font-medium text-gray-900">
            Pending Change
          </span>
        </div>
        <span className="text-sm text-gray-500">
          <ChangeDescription />
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
  );
}; 
import { FC } from "react";
import { Button } from "../../../../client/components/button";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";

export const UpdateReservationActionButtons: FC<{
  onCancel: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ onCancel, onSubmit, isLoading }) => {
  return (
    <div className="flex items-center justify-end space-x-3 m-2">
      <Button
        onClick={onCancel}
        ariaLabel="Cancel"
        variant="secondary"
        size="lg"
      >
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isLoading}
        isLoading={isLoading}
        icon={<ArrowRightCircleIcon className="w-6 h-6" />}
        ariaLabel="Confirm"
        variant="primary"
        size="lg"
      >
        Create Booking
      </Button>
    </div>
  );
};

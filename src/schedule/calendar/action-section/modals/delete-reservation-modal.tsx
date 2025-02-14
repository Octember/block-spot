import { FC, useMemo } from "react";
import {
  CalendarIcon,
  ClockIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Reservation } from "wasp/entities";
import { Button } from "../../../../client/components/button";
import { Modal } from "../../../../client/components/modal";
import { formatTimeWithZone } from "../../date-utils";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useVenueContext } from "../../providers/venue-provider";

export const DeleteReservationModal: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { cancelChange, applyChange } = usePendingChanges();
  const { getSpaceById, venue } = useVenueContext();
  const space = useMemo(
    () => getSpaceById(reservation.spaceId),
    [reservation.spaceId, getSpaceById],
  );

  return (
    <Modal
      className="flex"
      open={true}
      size="lg"
      onClose={() => { }}
      heading={{ title: "Delete Reservation" }}
      footer={
        <div className="flex items-center justify-end space-x-3 m-2">
          <Button
            onClick={cancelChange}
            ariaLabel="Cancel"
            variant="secondary"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={applyChange}
            ariaLabel="Confirm"
            variant="primary"
            size="lg"
          >
            Delete Booking
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 items-center">
        <p className="text-gray-600">
          Are you sure you want to delete this reservation?
        </p>
        <div className="flex items-center space-x-2 text-red-600">
          <Squares2X2Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{space?.name}</span>
          <CalendarIcon className="h-4 w-4 ml-2" />
          <span>{format(reservation.startTime, "EEE, MMM d")}</span>
          <ClockIcon className="h-4 w-4 ml-2" />
          <span>
            {formatTimeWithZone(reservation.startTime, "h:mm a", venue)} -{" "}
            {formatTimeWithZone(reservation.endTime, "h:mm a", venue)}
          </span>
        </div>
      </div>
    </Modal>
  );
}; 
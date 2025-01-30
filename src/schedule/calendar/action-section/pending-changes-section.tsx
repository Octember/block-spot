import {
  ArrowDownIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { FC } from "react";
import { Reservation } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { Modal } from "../../../client/components/modal";
import {
  PendingChange,
  usePendingChanges,
} from "../providers/pending-changes-provider";
function getChangeType(pendingChange: PendingChange | null) {
  if (pendingChange?.type === "CREATE") return "New Reservation";
  if (pendingChange?.type === "UPDATE") return "Update Reservation";
  if (pendingChange?.type === "DELETE") return "Delete Reservation";
  return "Pending Change";
}

export const PendingChangesSection = () => {
  const { pendingChange, cancelChange, applyChange } = usePendingChanges();

  if (!pendingChange) return null;

  return (
    <>
      <Modal
        className="flex lg:hidden"
        open={true}
        onClose={() => {}}
        heading={{ title: getChangeType(pendingChange) }}
        footer={
          <div className="flex items-center justify-end space-x-3 m-2">
            <Button
              onClick={cancelChange}
              ariaLabel="Cancel"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={applyChange} ariaLabel="Confirm" variant="primary">
              Confirm
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 items-center">
          {pendingChange?.type === "UPDATE" && pendingChange.oldState && (
            <>
              <ReservationChangeDescription
                reservation={pendingChange.oldState}
                color="gray"
              />
              <ArrowDownIcon className="h-4 w-4" />
            </>
          )}
          <ReservationChangeDescription
            reservation={pendingChange.newState}
            color={pendingChange?.type === "UPDATE" ? "blue" : "red"}
          />
        </div>
      </Modal>

      <div className="hidden lg:flex max-w-5xl mx-auto gap-3 items-center justify-between whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2" />
          <span className="text-xl font-medium text-gray-900">
            {getChangeType(pendingChange)}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          <ChangeDescription />
        </span>
        <div className="flex items-center space-x-3">
          <Button onClick={cancelChange} ariaLabel="Cancel" variant="secondary">
            Cancel
          </Button>
          <Button onClick={applyChange} ariaLabel="Apply" variant="primary">
            Apply
          </Button>
        </div>
      </div>
    </>
  );
};

const formatTime = (date: Date) => format(date, "h:mm a");

const ReservationChangeDescription: FC<{
  reservation: Reservation;
  color: "red" | "blue" | "gray";
}> = ({ reservation, color }) => {
  const colorMap: Record<typeof color, string> = {
    red: "text-red-600",
    blue: "text-blue-600",
    gray: "text-gray-600",
  };

  const colorClass = colorMap[color];

  return (
    <div className={`flex text-md items-center space-x-2 ${colorClass}`}>
      <CalendarIcon className="h-4 w-4" />
      <span>{format(reservation.startTime, "EEE, MMM d")}</span>
      <ClockIcon className="h-4 w-4 ml-2" />
      <span>
        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
      </span>
    </div>
  );
};

export const ChangeDescription = () => {
  const { pendingChange } = usePendingChanges();

  if (!pendingChange) return "";

  return (
    <div className="flex items-center justify-between space-x-2 text-gray-600 ">
      {pendingChange?.oldState && (
        <>
          <ReservationChangeDescription
            reservation={pendingChange.oldState}
            color="gray"
          />
          <ArrowRightIcon className="h-4 w-4" />
        </>
      )}
      <ReservationChangeDescription
        reservation={pendingChange.newState}
        color={pendingChange?.type === "DELETE" ? "red" : "blue"}
      />
    </div>
  );
};

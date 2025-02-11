import {
  ArrowDownIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { FC, useMemo } from "react";
import { useAuth } from "wasp/client/auth";
import { Reservation, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { Modal } from "../../../client/components/modal";
import { TimeSelect } from "../../../client/components/time-select";
import {
  PendingChange,
  usePendingChanges,
} from "../providers/pending-changes-provider";
import { useScheduleContext } from "../providers/schedule-context-provider";
import { CreateReservationModal } from "./create-reservation-modal";
import { formatTimeWithZone } from "../date-utils";

function getChangeType(pendingChange: PendingChange | null) {
  if (pendingChange?.type === "CREATE") return "New Reservation";
  if (pendingChange?.type === "UPDATE") return "Update Reservation";
  if (pendingChange?.type === "DELETE") return "Delete Reservation";
  return "Pending Change";
}

export const PendingChangesSection = () => {
  const { pendingChange, cancelChange, applyChange } = usePendingChanges();
  const { data: user } = useAuth();

  if (!pendingChange) return null;

  if (pendingChange.type === "CREATE" && user?.isAdmin) {
    return <CreateReservationModal reservation={pendingChange.newState} />;
  }

  return (
    <>
      <Modal
        className="flex" // lg:hidden"
        open={true}
        size="lg"
        onClose={() => { }}
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
            color={pendingChange?.type === "DELETE" ? "red" : "blue"}
            editable={pendingChange?.type === "UPDATE"}
          />
        </div>
      </Modal>

      <div className="hidden max-w-5xl mx-auto gap-3 items-center justify-between whitespace-nowrap">
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

const ReservationChangeDescription: FC<{
  reservation: Reservation;
  color: "red" | "blue" | "gray";
  editable?: boolean;
}> = ({ reservation, color, editable }) => {
  const { getSpaceById, venue } = useScheduleContext();
  const space = useMemo(
    () => getSpaceById(reservation.spaceId),
    [reservation.spaceId, getSpaceById],
  );

  const { pendingChange, setPendingChange } = usePendingChanges();

  const colorMap: Record<typeof color, string> = {
    red: "text-red-600",
    blue: "text-blue-600",
    gray: "text-gray-600",
  };

  const colorClass = colorMap[color];

  return (
    <div
      className={`flex text-md items-center space-x-2 text-nowrap ${colorClass}`}
    >
      <Squares2X2Icon className="h-4 w-4" />

      <span className="text-sm font-semibold">{space?.name}</span>

      <CalendarIcon className="h-4 w-4" />
      <span>{format(reservation.startTime, "EEE, MMM d")}</span>
      <ClockIcon className="h-4 w-4 ml-2" />
      <span className="flex items-center">
        {editable ? (
          <div className="flex items-center">
            <TimeSelect
              value={reservation.startTime}
              onChange={(hour, minute) => {
                if (!pendingChange) return;
                setPendingChange({
                  ...pendingChange,
                  newState: {
                    ...pendingChange.newState,
                    startTime: new Date(
                      reservation.startTime.setHours(hour, minute),
                    ),
                  },
                });
              }}
            />
            -
            <TimeSelect
              value={reservation.endTime}
              onChange={(hour, minute) => {
                if (!pendingChange) return;
                if (hour < reservation.startTime.getHours()) return;

                setPendingChange({
                  ...pendingChange,
                  newState: {
                    ...pendingChange.newState,
                    endTime: new Date(
                      reservation.endTime.setHours(hour, minute),
                    ),
                  },
                });
              }}
            />
          </div>
        ) : (
          formatTime(reservation.startTime, venue) +
          " - " +
          formatTime(reservation.endTime, venue)
        )}
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
          <ArrowRightIcon className="size-5" />
        </>
      )}
      {pendingChange.type === "DELETE" && (
        <ReservationChangeDescription
          reservation={pendingChange.newState}
          color="red"
        />
      )}
      {(pendingChange.type === "CREATE" || pendingChange.type === "UPDATE") && (
        <ReservationChangeDescription
          reservation={pendingChange.newState}
          color="blue"
          editable
        />
      )}
    </div>
  );
};

const formatTime = (date: Date, venue: Venue) => formatTimeWithZone(date, "h:mm a", venue);

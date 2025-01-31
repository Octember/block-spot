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


const ReservationChangeDescription: FC<{
  reservation: Reservation;
  color: "red" | "blue" | "gray";
  editable?: boolean;
}> = ({ reservation, color, editable }) => {
  const { pendingChange, setPendingChange } = usePendingChanges();

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
      <span className="flex items-center">
        {editable ? (
          <div className="flex items-center">
            <TimeSelect
              time={reservation.startTime}
              onChange={(hour, minute) => {
                if (!pendingChange) return;
                setPendingChange({
                  ...pendingChange,
                  newState: {
                    ...pendingChange.newState,
                    startTime: new Date(reservation.startTime.setHours(hour, minute)),
                  },
                });
              }}
            />
            -
            <TimeSelect
              time={reservation.endTime}
              onChange={(hour, minute) => {
                if (!pendingChange) return;
                setPendingChange({
                  ...pendingChange,
                  newState: {
                    ...pendingChange.newState,
                    endTime: new Date(reservation.endTime.setHours(hour, minute)),
                  },
                });
              }}
            />

          </div>
        ) : (
          formatTime(reservation.startTime) + " - " + formatTime(reservation.endTime)
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

const formatTime = (date: Date) => format(date, "h:mm a");

interface TimeSelectProps {
  time: Date;
  onChange: (hour: number, minute: number) => void;
}

const TimeSelect: FC<TimeSelectProps> = ({ time, onChange }) => {
  return (
    <select
      className="bg-transparent rounded-lg focus:ring-0 cursor-pointer "
      onChange={(e) => {
        const [hour, minute] = e.target.value.split(":");
        onChange(Number(hour), Number(minute));
      }}
      value={format(time, "HH:mm")}
    >
      {Array.from({ length: 24 * 4 }).map((_, i) => {
        const hour = Math.floor(i / 4);
        const minutes = (i % 4) * 15;
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        return (
          <option key={time} value={time}>
            {format(new Date().setHours(hour, minutes), "h:mm a")}
          </option>
        );
      })}
    </select>
  );
};

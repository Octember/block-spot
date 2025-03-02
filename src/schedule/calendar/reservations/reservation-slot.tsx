import { useDraggable } from "@dnd-kit/core";
import { addMinutes } from "date-fns";
import { useMemo } from "react";
import { Reservation } from "wasp/entities";
import { useAuthUser } from "../../../auth/providers/AuthUserProvider";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useVenueContext } from "../providers/venue-provider";
import { useReservationSelection } from "../selection";
import { getColorStyles } from "./colors";
import { MinutesPerSlot, PixelsPerSlot } from "./constants";
import { ReservationDescription } from "./reservation-description";
import { ReservationMenu } from "./reservation-menu";
import {
  getReservationDurationInSlots,
  getRowIndex,
  getRowSpan,
} from "./utilities";

type ReservationSlotProps = {
  reservation: Reservation;
  gridIndex: number;
  isDraft: boolean;
  onCreate?: () => void;
  onDiscardDraft?: () => void;
  onDelete?: () => void;
};

export const ReservationSlot = (props: ReservationSlotProps) => {
  const { venue } = useVenueContext();
  const { reservation, gridIndex, isDraft } = props;
  const { isOwner, user } = useAuthUser();
  const canEdit = useMemo(() => {
    if (isOwner) {
      return true;
    }
    if (isDraft) {
      return true;
    }
    return props.reservation.userId === user?.id;
  }, [isOwner, isDraft, props.reservation.userId, user?.id]);

  const numSlots = useMemo(
    () => getReservationDurationInSlots(reservation),
    [reservation],
  );

  const {
    selection: { isSelecting },
  } = useReservationSelection();
  const { pendingChange, setPendingChange } = usePendingChanges();

  const disabled =
    !canEdit ||
    (pendingChange ? pendingChange.newState.id !== reservation.id : false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    over,
    isDragging,
    active,
  } = useDraggable({
    id: `reservation-${reservation.id}`,
    data: {
      reservationId: reservation.id,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    },
    disabled,
  });

  const startRow = useMemo(
    () => getRowIndex(venue, reservation.startTime),
    [venue, reservation.startTime],
  );
  const rowSpan = useMemo(() => getRowSpan(reservation), [reservation]);

  const colorStyles = useMemo(
    () =>
      getColorStyles({
        isDraft,
        over,
        isDragging,
        otherNodeActive: Boolean(active || isSelecting || pendingChange),
        canEdit,
      }),
    [isDraft, over, isDragging, active, canEdit, isSelecting, pendingChange],
  );

  // Take into account the current drag position
  const newTimes = useMemo(() => {
    if (isDragging && transform) {
      const delta = (transform.y / PixelsPerSlot) * MinutesPerSlot;
      const rounded = Math.round(delta / MinutesPerSlot) * MinutesPerSlot;

      return {
        startTime: addMinutes(reservation.startTime, rounded),
        endTime: addMinutes(reservation.endTime, rounded),
      };
    }
    return {
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    };
  }, [reservation, isDragging, transform]);

  const marginStyles = useMemo(() => {
    if (numSlots < 2) {
      return "mx-2 my-0";
    }
    if (numSlots < 3) {
      return "mx-2 my-0.5";
    }
    return "mx-2 my-1";
  }, [numSlots]);

  return (
    <li
      className={`relative flex ${isDragging ? "z-50" : "z-20"} select-none bg-white rounded-lg ${marginStyles}`}
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: gridIndex + 1,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      ref={setNodeRef}
      onClick={
        canEdit
          ? () => {
              setPendingChange({
                type: "UPDATE",
                newState: reservation,
                oldState: reservation,
              });
            }
          : undefined
      }
      {...attributes}
      {...listeners}
    >
      <a
        className={`
          group w-full max-h-full flex flex-col justify-between
          px-2 py-0
          rounded-lg border-l-8 border ${colorStyles}
          text-xs/5
          shadow-xl hover:shadow-2xl
          truncate text-ellipsis
        `}
      >
        <div className="flex flex-col flex-1 h-full">
          <div className="flex flex-row justify-between h-full">
            <ReservationDescription
              reservation={reservation}
              startTime={newTimes.startTime}
              endTime={newTimes.endTime}
            />

            {/* {numSlots >= 2 && (
              <ReservationMenu
                onEdit={() =>
                  setPendingChange({
                    type: "UPDATE",
                    newState: reservation,
                    oldState: reservation,
                  })
                }
                onDelete={props.onDelete}
                canEdit={canEdit}
              />
            )} */}
          </div>
        </div>
      </a>
    </li>
  );
};

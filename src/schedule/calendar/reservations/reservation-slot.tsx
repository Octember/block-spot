import { Over, useDraggable } from "@dnd-kit/core";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { addMinutes, format } from "date-fns";
import { useMemo, useState } from "react";
import { Reservation } from "wasp/entities";
import { isUserOwner } from "../../../client/hooks/permissions";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useScheduleContext } from "../providers/schedule-query-provider";
import { useReservationSelection } from "../selection";
import { MinutesPerSlot, PixelsPerSlot } from "./constants";
import { getRowIndex, getRowSpan } from "./utilities";

type ReservationSlotProps = {
  reservation: Reservation;
  gridIndex: number;
  isDraft: boolean;
  onCreate?: () => void;
  onDiscardDraft?: () => void;
  onDelete?: () => void;
};

const GrayColorStyle =
  "bg-gradient-to-br from-gray-200 hover:from-gray-50 to-gray-50 hover:to-gray-300 border-gray-400 hover:border-gray-500";
const BlueColorStyle =
  "bg-gradient-to-br from-blue-50 hover:from-blue-100 to-blue-200 hover:to-blue-200 border-blue-400 hover:border-blue-500";

function getColorStyles({
  isDraft,
  over,
  isDragging,
  otherNodeActive,
  isOwner,
}: {
  isDraft: boolean;
  over: Over | null;
  isDragging: boolean;
  otherNodeActive: boolean;
  isOwner: boolean;
}) {
  const opacityStyle = isDragging ? "opacity-50" : "";

  if (isDragging && over && over.data.current?.occupied) {
    return `bg-red-50 hover:bg-red-100 border-red-500 ${opacityStyle}`;
  }
  if (isDraft || isDragging) {
    return `${BlueColorStyle} ${opacityStyle}`;
  }

  if (otherNodeActive) {
    return GrayColorStyle;
  }

  if (isOwner) {
    return BlueColorStyle;
  }

  return GrayColorStyle;
}

export const ReservationSlot = (props: ReservationSlotProps) => {
  const { venue } = useScheduleContext();
  const { reservation, gridIndex, isDraft } = props;
  const isOwner = isUserOwner();

  const { isSelecting } = useReservationSelection();
  const { pendingChange } = usePendingChanges();

  const disabled =
    (!isDraft && !isOwner) ||
    (pendingChange ? pendingChange.oldState?.id !== reservation.id : false);

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

  const startRow = getRowIndex(venue, reservation.startTime);
  const rowSpan = getRowSpan(reservation);

  const colorStyles = useMemo(
    () =>
      getColorStyles({
        isDraft,
        over,
        isDragging,
        otherNodeActive: Boolean(active || isSelecting || pendingChange),
        isOwner,
      }),
    [isDraft, over, isDragging, active, isOwner, isSelecting, pendingChange],
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

  return (
    <li
      className="relative flex z-20 select-none"
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: gridIndex + 1,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <a
        className={`group w-full my-1 mx-2 flex flex-col justify-between rounded-lg p-2 text-xs/5 border-l-8 border ${colorStyles} shadow-xl hover:shadow-2xl`}
      >
        <div className="flex flex-col flex-1">
          <div className="flex flex-row justify-between">
            <p className="font-semibold text-gray-700">
              <time dateTime="2022-01-12T06:00">
                {format(newTimes.startTime, "h:mm a")} -{" "}
                {format(newTimes.endTime, "h:mm a")}
              </time>
            </p>

            {isOwner && (
              <ReservationMenu onEdit={() => { }} onDelete={props.onDelete} />
            )}
          </div>
        </div>
      </a>
    </li>
  );
};

import { usePopper } from "react-popper";

const ReservationMenu = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete?: () => void;
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, { placement: 'bottom-end' });

  return (
    <Popover className="relative group">
      <PopoverButton ref={setReferenceElement}>
        <EllipsisHorizontalIcon
          aria-hidden="true"
          className="size-5 text-gray-400 group-hover:text-gray-700"
        />
      </PopoverButton>

      <PopoverPanel
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className="bg-white z-99 w-30 rounded-md shadow-lg ring-1 ring-black/5"
      >
        <div className="py-1">
          <button
            onClick={onEdit}
            className="group flex gap-2 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <PencilSquareIcon className="size-4 text-gray-400 group-hover:text-gray-700" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="group flex gap-2 items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <TrashIcon className="size-4 text-red-400 group-hover:text-red-700" />
            Delete
          </button>
        </div>
      </PopoverPanel>
    </Popover>
  );
};

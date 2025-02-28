import { useDraggable } from "@dnd-kit/core";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { addMinutes } from "date-fns";
import { useMemo, useState } from "react";
import { Reservation } from "wasp/entities";
import { formatTimeWithZone } from "../date-utils";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useReservationSelection } from "../selection";
import { MinutesPerSlot, PixelsPerSlot } from "./constants";
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

const ReservationDescription = ({
  reservation,
  startTime,
  endTime,
}: {
  reservation: Reservation;
  startTime: Date;
  endTime: Date;
}) => {
  const { venue } = useVenueContext();
  const numSlots = useMemo(() => getReservationDurationInSlots(reservation), [reservation]);


  const timeSection = useMemo(() => {
    if (numSlots < 2) {
      return null;
    }

    return (
      <p>
        <time dateTime={reservation.startTime.toISOString()}>
          {formatTimeWithZone(startTime, "h:mm a", venue)} -{" "}
          {formatTimeWithZone(endTime, "h:mm a", venue)}
        </time>
      </p>
    );
  }, [reservation, startTime, endTime]);

  const titleSection = useMemo(() => {
    if (!reservation.description) {
      return null;
    }
    return (
      // Needs to be max-w-30 so the name doesn't stretch the slot
      <p className="font-bold text-gray-900 max-w-30 text-ellipsis whitespace-nowrap overflow-hidden">
        {reservation.description}
      </p>
    );
  }, [reservation.description]);


  const sectionsToRender = useMemo(
    () =>
      [titleSection, timeSection]
        .filter(Boolean)
        .slice(0, numSlots / 2),
    [titleSection, timeSection, reservation, numSlots],
  );

  return (
    <div className="flex flex-row gap-2">

      <div className="pt-1">
        {numSlots > 1 && <LuUserCircle className="size-3" />}
      </div>
      <div className="flex flex-col text-gray-700">
        {sectionsToRender.map((section, index) => (
          <div key={index}>{section}</div>
        ))}
      </div>
    </div>
  );
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

  const numSlots = useMemo(() => getReservationDurationInSlots(reservation), [reservation]);

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
      onClick={canEdit ? () => {
        setPendingChange({
          type: "UPDATE",
          newState: reservation,
          oldState: reservation,
        });
      } : undefined}
      {...attributes}
      {...listeners}
    >
      <a
        className={`group w-full flex flex-col justify-between rounded-lg px-2 py-0 text-xs/5 border-l-8 border ${colorStyles} shadow-xl hover:shadow-2xl`}
      >
        <div className="flex flex-col flex-1">
          <div className="flex flex-row justify-between">
            <ReservationDescription
              reservation={reservation}
              startTime={newTimes.startTime}
              endTime={newTimes.endTime}
            />

            {numSlots >= 2 && (
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
            )}
          </div>
        </div>
      </a>
    </li>
  );
};

import { LuUserCircle } from "react-icons/lu";
import { usePopper } from "react-popper";
import { useAuthUser } from "../../../auth/providers/AuthUserProvider";
import { useVenueContext } from "../providers/venue-provider";
import { getColorStyles } from "./colors";

const ReservationMenu = ({
  canEdit,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
  });

  return (
    <Popover className={`relative group ${canEdit ? "" : "hidden"}`}>
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
        className="bg-white z-999 w-30 rounded-md shadow-lg ring-1 ring-black/5"
      >
        <div className="py-1 flex flex-col items-stretch">
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

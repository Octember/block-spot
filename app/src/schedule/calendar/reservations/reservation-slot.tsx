import { useDraggable } from "@dnd-kit/core";
import {
  Popover,
  PopoverButton,
  PopoverPanel
} from "@headlessui/react";
import {
  CheckIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  createReservation,
  updateReservation
} from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { UpdateButton } from './update-button';
import { getRowSpan } from './utilities';

type ReservationSlotProps = {
  reservation: Reservation;
  gridIndex: number;
  isDraft: boolean;
  onCreate?: () => void;
  onDiscardDraft?: () => void;
  onDelete?: () => void;
};

export const ReservationSlot = (props: ReservationSlotProps) => {
  const { reservation, gridIndex, isDraft } = props;
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `reservation-${reservation.id}`,
    data: {
      reservationId: reservation.id,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    },
  });

  useEffect(() => {
    if (isDraft && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isDraft]);

  // TODO: start and end row are not correct, current hardcoded to 8AM
  const startRow = Math.ceil(
    reservation.startTime.getHours() * 2 +
    reservation.startTime.getMinutes() / 30 -
    7 * 2
  );

  const rowSpan = getRowSpan(reservation);

  const colorStyles = isDraft
    ? "bg-pink-50 hover:bg-pink-100 border-pink-400"
    : "bg-blue-50 hover:bg-blue-100 border-blue-500";

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(reservation.description);

  return (
    <li
      className="relative flex"
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: gridIndex + 1,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <a
        href="#"
        className={`group w-full my-1 mx-2 flex flex-col justify-between rounded-lg p-2 text-xs/5 border-l-8 border ${colorStyles} shadow-xl`}
      >
        <div className="flex flex-col flex-1">
          <div className="flex flex-row justify-between">
            {isDraft || isEditing ? (
              <form
                className="flex flex-row gap-2 items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isDraft) {
                    await createReservation({
                      spaceId: reservation.spaceId,
                      startTime: reservation.startTime,
                      endTime: reservation.endTime,
                      description: description,
                    });
                    props.onCreate?.();

                  } else {
                    await updateReservation({
                      id: reservation.id,
                      description: description,
                    });
                  }
                  setIsEditing(false);
                }}
              >
                <input
                  autoFocus
                  ref={descriptionInputRef}
                  id="title"
                  name="title"
                  type="text"
                  className="block text-xs font-medium py-0.5 max-w-40 rounded placeholder:text-gray-400 focus:outline-0"
                  placeholder="Description"
                  value={description || undefined}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                />
                {!isDraft && (
                  <button type="submit">
                    <CheckIcon className="size-5 bg-green-500 hover:bg-green-600 rounded p-0.5 text-white" />
                  </button>
                )}
                {isDraft &&
                  <div className="flex flex-row justify-end gap-2">
                    <UpdateButton
                      type="submit"
                      color="green"
                      text="Create"
                    />
                    <UpdateButton
                      color="red"
                      onClick={() => props.onDiscardDraft?.()}
                      text="Cancel"
                    />
                  </div>
                }
              </form>
            ) : (
              <p className="font-semibold text-gray-700">
                {reservation.description}
              </p>
            )}

            <Popover className="relative">
              <PopoverButton>
                <EllipsisHorizontalIcon
                  aria-hidden="true"
                  className="size-5 text-gray-400 group-hover:text-gray-700"
                />
              </PopoverButton>

              <PopoverPanel className="fixed bg-white z-50 w-30 rounded-md shadow-lg ring-1 ring-black/5">
                <div className="py-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group flex gap-2 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PencilSquareIcon
                      aria-hidden="true"
                      className="size-3 group-data-[focus]:text-gray-500"
                    />
                    Edit
                  </button>
                  <button
                    onClick={
                      props.isDraft ? props.onDiscardDraft : props.onDelete
                    }
                    className="group flex gap-2 items-center px-4 w-full py-2 text-sm text-red-600 hover:bg-red-100"
                  >
                    <TrashIcon
                      aria-hidden="true"
                      className="size-3 group-data-[focus]:text-gray-500"
                    />
                    Delete
                  </button>
                </div>
              </PopoverPanel>
            </Popover>
          </div>

          <div className="flex flex-row justify-between h-full">
            <p className="text-gray-500 group-hover:text-gray-700">
              <time dateTime="2022-01-12T06:00">
                {format(reservation.startTime, "h:mm a")} -{" "}
                {format(reservation.endTime, "h:mm a")}
              </time>
            </p>
          </div>
        </div>
      </a>
    </li>
  );
};

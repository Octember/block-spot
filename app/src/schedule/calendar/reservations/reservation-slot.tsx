import { Over, useDraggable } from "@dnd-kit/core";
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
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createReservation,
  updateReservation
} from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { UpdateButton } from './update-button';
import { getRowSpan, getRowIndex } from './utilities';
import { useScheduleContext } from "../providers/schedule-query-provider";
import { TextInput } from '../../../client/components/form/text-input';

type ReservationSlotProps = {
  reservation: Reservation;
  gridIndex: number;
  isDraft: boolean;
  onCreate?: () => void;
  onDiscardDraft?: () => void;
  onDelete?: () => void;
};

function getColorStyles(isDraft: boolean, over: Over | null, isDragging: boolean) {
  if (isDragging && over && over.data.current?.occupied) {
    return "bg-red-50 hover:bg-red-100 border-red-500";
  }
  if (isDraft || isDragging) {
    return "bg-gradient-to-br from-blue-50 hover:from-blue-100 to-blue-200 hover:to-blue-200 border-blue-400 hover:border-blue-500";
  }
  return "bg-gradient-to-br from-gray-200 hover:from-gray-50 to-gray-50 hover:to-gray-300 border-gray-400 hover:border-gray-500";
}

export const ReservationSlot = (props: ReservationSlotProps) => {

  const { venue, refresh } = useScheduleContext();

  const { reservation, gridIndex, isDraft } = props;
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, over, isDragging } = useDraggable({
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

  const startRow = getRowIndex(venue, reservation.startTime);
  const rowSpan = getRowSpan(reservation);

  const colorStyles = useMemo(() => getColorStyles(isDraft, over, isDragging), [isDraft, over, isDragging]);

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
        className={`group w-full my-1 mx-2 flex flex-col justify-between rounded-lg p-2 text-xs/5 border-l-8 border ${colorStyles} shadow-xl hover:shadow-2xl`}
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
                    refresh();

                    props.onCreate?.();

                  } else {
                    await updateReservation({
                      id: reservation.id,
                      description: description,
                    });
                    refresh();
                  }
                  setIsEditing(false);
                }}
              >
                <TextInput
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

            <ReservationMenu
              onEdit={() => setIsEditing(true)}
              onDelete={() => props.isDraft ? props.onDiscardDraft?.() : props.onDelete?.()}
            />
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
    </li >
  );
};


const ReservationMenu = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {

  return (
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
            onClick={onEdit}
            className="group flex gap-2 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <PencilSquareIcon
              aria-hidden="true"
              className="size-3 group-data-[focus]:text-gray-500"
            />
            Edit
          </button>
          <button
            onClick={onDelete}
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
  );
};
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { format } from "date-fns";
import { Reservation } from "wasp/entities";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  PopoverButton,
  PopoverPanel,
} from "@headlessui/react";
import { Popover } from "@headlessui/react";
import {
  createTask,
  useQuery,
  createReservation,
  deleteReservation,
  updateReservation,
} from "wasp/client/operations";
import { useEffect, useRef, useState } from "react";

type ReservationSlotProps = {
  reservation: Reservation;
  gridIndex: number;
} & (
  | {
      isDraft: true;
      onCreate: () => void;
      onDiscardDraft: () => void;
    }
  | {
      isDraft: false;
      onDelete: () => void;
    }
);

export const ReservationSlot = (props: ReservationSlotProps) => {
  const { reservation, gridIndex, isDraft } = props;
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDraft && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isDraft]);

  // TODO: start and end row are not correct, current hardcoded to 8AM
  const startRow =
    1 +
    Math.ceil(
      reservation.startTime.getHours() * 2 +
        reservation.startTime.getMinutes() / 30 -
        (7 * 2 + 1)
    );
  const endRow =
    1 +
    Math.ceil(
      reservation.endTime.getHours() * 2 +
        reservation.endTime.getMinutes() / 30 -
        (7 * 2 + 1)
    );
  const rowSpan = Math.round(endRow - startRow);

  const colorStyles = isDraft
    ? "bg-pink-100 hover:bg-pink-200"
    : "bg-blue-50 hover:bg-blue-100";

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(reservation.description);

  return (
    <li
      className="relative flex"
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: gridIndex + 1,
      }}
    >
      <a
        href="#"
        className={`group absolute inset-0.5 flex flex-col justify-between overflow-y-auto rounded-lg p-2 text-xs/5 ${colorStyles}`}
      >
        <div>
          <div className="flex flex-row justify-between">
            {isDraft || isEditing ? (
              <div className="flex flex-row gap-2 items-center">
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
                  <CheckIcon
                    onClick={async () => {
                      await updateReservation({
                        id: reservation.id,
                        description: description,
                      });
                      setIsEditing(false);
                    }}
                    className="size-5 bg-green-500 hover:bg-green-600 rounded p-0.5 text-white"
                  />
                )}
              </div>
            ) : (
              <p className="font-semibold text-blue-700">
                {reservation.description}
              </p>
            )}

            <Popover className="relative">
              <PopoverButton>
                <EllipsisHorizontalIcon
                  aria-hidden="true"
                  className="mr-1 size-5 text-gray-400 group-hover:text-blue-700"
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

          <p className="text-blue-500 group-hover:text-blue-700">
            <time dateTime="2022-01-12T06:00">
              {format(reservation.startTime, "h:mm a")} -{" "}
              {format(reservation.endTime, "h:mm a")}
            </time>
          </p>
        </div>

        {isDraft && (
          <div className="flex flex-row justify-end gap-2">
            <UpdateButton
              color="green"
              onClick={async () => {
                await createReservation({
                  spaceId: reservation.spaceId,
                  startTime: reservation.startTime,
                  endTime: reservation.endTime,
                  description: reservation.description,
                });
                props.onCreate();
              }}
              text="Create"
            />
            <UpdateButton
              color="red"
              onClick={props.onDiscardDraft}
              text="Delete"
            />
          </div>
        )}
      </a>
    </li>
  );
};

const UpdateButton = ({
  onClick,
  color,
  text,
}: {
  onClick: () => void;
  color: "red" | "green";
  text: string;
}) => {
  const colorStyle = color === "red" ? "bg-red-500" : "bg-green-500";
  const hoverStyle =
    color === "red" ? "hover:bg-red-600" : "hover:bg-green-600";

  return (
    <button
      onClick={onClick}
      className={`${colorStyle} justify-self-end hover:${hoverStyle} text-white px-2 py-1 rounded-md`}
    >
      {text}
    </button>
  );
};

import {
  Bars3Icon,
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

export const ReservationSlot = ({
  reservation,
  gridIndex,
  isDraft,
  onDelete,
}: {
  reservation: Reservation;
  gridIndex: number;
  isDraft?: boolean;
  onDelete?: () => void;
}) => {
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

  return (
    <li
      className="relative mt-px flex"
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: gridIndex + 1,
      }}
    >
      <a
        href="#"
        className={`group absolute inset-1 flex flex-col justify-between overflow-y-auto rounded-lg p-2 text-xs/5 ${colorStyles}`}
      >
        <div>
          <div className="flex flex-row justify-between">
            <p className="font-semibold text-blue-700">
              {reservation.description}
            </p>

            <Popover className="relative">
              <PopoverButton>
                <EllipsisHorizontalIcon
                  aria-hidden="true"
                  className="-mr-1 size-5 text-gray-400 group-hover:text-blue-700"
                />
              </PopoverButton>

              <PopoverPanel className="fixed bg-white z-50 w-30 rounded-md shadow-lg ring-1 ring-black/5">
                <div className="py-1">
                  <a
                    href="#"
                    className="group flex gap-2 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PencilSquareIcon
                      aria-hidden="true"
                      className="size-3 group-data-[focus]:text-gray-500"
                    />
                    Edit
                  </a>
                  <button
                    onClick={() => {
                      console.log("delete");
                    }}
                    className="group flex gap-2 items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100"
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
            <button className="bg-green-500 justify-self-end hover:bg-green-600 text-white px-2 py-1 rounded-md">
              create
            </button>
            <button onClick={onDelete} className="bg-red-500 justify-self-end hover:bg-red-600 text-white px-2 py-1 rounded-md">
              discard
            </button>
          </div>
        )}
      </a>
    </li>
  );
};

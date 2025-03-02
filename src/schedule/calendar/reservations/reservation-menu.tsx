import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
import { usePopper } from "react-popper";

export const ReservationMenu = ({
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
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="group flex gap-2 items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <PencilSquareIcon className="size-4 text-gray-400 group-hover:text-gray-700" />
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
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

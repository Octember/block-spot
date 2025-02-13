import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { FC, forwardRef, useState } from "react";
import { Space } from "wasp/entities";
import { Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline";
import { AddSpaceModal } from "./add-space-modal";
import pluralize from "pluralize";
import { DeleteSpaceButton } from "./delete-space-button";
import { UpdateSpaceButton } from "./update-space-button";
import { useSortable } from "@dnd-kit/sortable";
import { useAuthUser } from "../../../auth/providers/AuthUserProvider";

const ListItemStyle =
  "flex flex-row p-2 rounded-md border border-gray-200 items-center h-16";

export const SortableSpaceCard: FC<{ space: Space }> = ({ space }) => {
  const { isOwner } = useAuthUser();
  const { attributes, listeners, setNodeRef } =
    useSortable({ id: space.id, disabled: !isOwner });

  return (
    <SpaceCard space={space} ref={setNodeRef} {...attributes} {...listeners} />
  );
};

export const SpaceCard = forwardRef<HTMLLIElement, { space: Space }>(
  ({ space, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={`${ListItemStyle} bg-gray-100 justify-between`}
        {...props}
      >
        <div className="flex flex-row items-center gap-4">
          <Squares2X2Icon className="size-5" />
          <div className="flex flex-col gap-0.5">
            <div className="text-md font-semibold">{space.name}</div>
            <div className="text-sm text-gray-500">
              Capacity: {pluralize("person", space.capacity, true)}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2">
          <DeleteSpaceButton spaceId={space.id} />
          <UpdateSpaceButton space={space} />
        </div>
      </li>
    );
  },
);

SpaceCard.displayName = "SpaceCard";

export const AddSpaceButton = ({ venueId }: { venueId: string }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <li
        onClick={() => setShowModal(true)}
        className={`${ListItemStyle} cursor-pointer justify-center border-dashed border-2 border-gray-300 bg-white hover:bg-gray-100`}
      >
        <PlusIcon className="size-5" />
        <div className="text-md">Add space</div>
      </li>
      <AddSpaceModal
        open={showModal}
        onClose={() => setShowModal(false)}
        venueId={venueId}
      />
    </>
  );
};

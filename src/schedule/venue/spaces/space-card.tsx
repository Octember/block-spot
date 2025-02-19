import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { FC, forwardRef, useState } from "react";
import { Space } from "wasp/entities";
import { Squares2X2Icon, TrashIcon } from "@heroicons/react/24/outline";
import { LuMenu } from "react-icons/lu";
import { AddSpaceModal } from "./add-space-modal";
import pluralize from "pluralize";
import { DeleteSpaceButton } from "./delete-space-button";
import { UpdateSpaceButton } from "./update-space-button";
import { useSortable } from "@dnd-kit/sortable";
import { useAuthUser } from "../../../auth/providers/AuthUserProvider";
import { useParams } from "react-router-dom";

const ListItemStyle =
  "flex flex-row p-2 rounded-md border border-gray-200 items-center h-16";

export const SortableSpaceCard: FC<{ space: Space; refetch: () => void }> = ({
  space,
  refetch,
}) => {
  const { isOwner } = useAuthUser();
  const { attributes, listeners, setNodeRef } = useSortable({
    id: space.id,
    disabled: !isOwner,
  });

  return (
    <SpaceCard
      space={space}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      isDragging={false}
      refetch={refetch}
    />
  );
};

export const SpaceCard = forwardRef<
  HTMLLIElement,
  { space: Space; isDragging: boolean; refetch: () => void }
>(({ space, refetch, isDragging, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={`${ListItemStyle} bg-gray-100 border-gray-200 ${isDragging ? "bg-gray-200 border-gray-400" : ""} border justify-between`}
    >
      <div className="flex flex-row items-center gap-4">
        <div {...props}>
          <LuMenu className="size-5" />
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="text-md font-semibold">{space.name}</div>
          <div className="text-sm text-gray-500">
            Capacity: {pluralize("person", space.capacity, true)}
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center gap-2">
        <DeleteSpaceButton spaceId={space.id} />
        <UpdateSpaceButton space={space} refetch={refetch} />
      </div>
    </li>
  );
});

SpaceCard.displayName = "SpaceCard";

export const AddSpaceButton = () => {
  const { venueId } = useParams();
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
        venueId={venueId!}
      />
    </>
  );
};

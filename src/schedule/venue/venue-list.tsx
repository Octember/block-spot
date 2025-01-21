import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { FC, useState } from "react";
import { Space, Venue } from "wasp/entities";
import { Link, routes } from "wasp/client/router";
import { format } from "date-fns";
import {
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  Cog8ToothIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Button } from "../../client/components/button";
import { AddSpaceModal } from "./spaces/add-space-modal";
import pluralize from "pluralize";
import { BulkSpaceCreator } from "./spaces/bulk-create-spaces";

export const VenueList: FC<{ venues: (Venue & { spaces: Space[] })[] }> = ({
  venues,
}) => {
  return (
    <ul role="list" className="gap-4">
      {venues.map((venue) => (
        <VenueCard venue={venue} key={venue.id} />
      ))}
    </ul>
  );
};

const VenueCard = ({ venue }: { venue: Venue & { spaces: Space[] } }) => {
  return (
    <li className="relative flex flex-col justify-between gap-x-6 px-4 py-5 sm:px-6 lg:px-8 border border-gray-200 rounded-md">
      <div className="flex flex-row justify-between border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold flex flex-row items-center gap-2">
          <BuildingOffice2Icon className="size-6" />
          {venue.name}
        </h2>
        <div>
          <BulkSpaceCreator venueId={venue.id} />

          <Link to={routes.VenuePageRoute.to} params={{ venueId: venue.id }}>
            <Button
              icon={<Cog8ToothIcon className="size-4" />}
              ariaLabel="Settings"
              variant="tertiary"
            />
          </Link>
        </div>
      </div>

      <ul className="flex flex-col gap-2 p-2">
        {venue.spaces.map((space) => (
          <SpaceCard space={space} key={space.id} />
        ))}
        <AddSpaceButton venueId={venue.id} />
      </ul>
    </li>
  );
};

const SpaceCard = ({ space }: { space: Space }) => {
  return (
    <li className={`${ListItemStyle} bg-gray-100 justify-between`}>
      <div className="flex flex-row items-center gap-4">
        <Squares2X2Icon className="size-5" />
        <div className="flex flex-col gap-0.5">
          <div className="text-md font-semibold">{space.name}</div>
          <div className="text-sm text-gray-500">
            Capacity: {pluralize("person", space.capacity, true)}
          </div>
        </div>
      </div>

      <div className="flex flex-row items-center gap-2"></div>
    </li>
  );
};

const ListItemStyle =
  "flex flex-row p-2 rounded-md border border-gray-200 items-center h-16";

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

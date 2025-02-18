import {
  BuildingOffice2Icon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";
import { FC } from "react";
import { Link, routes } from "wasp/client/router";
import { Space, Venue } from "wasp/entities";
import { Button } from "../../client/components/button";

import { BulkSpaceCreator } from "./spaces/bulk-create-spaces";
import { SpaceList } from "./spaces/space-list";

export const VenueList: FC<{
  venues: (Venue & { spaces: Space[] })[];
  refetch: () => void;
}> = ({ venues, refetch }) => {
  return (
    <ul role="list" className="flex flex-col gap-4">
      {venues.map((venue) => (
        <VenueCard venue={venue} key={venue.id} refetch={refetch} />
      ))}
    </ul>
  );
};

const VenueCard = ({
  venue,
  refetch,
}: {
  venue: Venue & { spaces: Space[] };
  refetch: () => void;
}) => {
  return (
    <li className="relative flex flex-col justify-between gap-x-6 py-5 bg-white border border-gray-200 rounded-md">
      <div className="flex flex-row justify-between border-b border-gray-200 pb-4 px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold flex flex-row items-center gap-2">
          <BuildingOffice2Icon className="size-6" />
          {venue.name}
        </h2>
        <div className="flex flex-row gap-2 items-center">
          <BulkSpaceCreator venueId={venue.id} />

          <Link to={routes.VenuePageRoute.to} params={{ venueId: venue.id }}>
            <Button
              icon={<Cog8ToothIcon className="size-5" />}
              ariaLabel="Settings"
              variant="secondary"
            />
          </Link>
        </div>
      </div>

      <SpaceList spaces={venue.spaces} refetch={refetch} />
    </li>
  );
};

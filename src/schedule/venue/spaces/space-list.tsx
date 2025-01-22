import { Space } from "wasp/entities";
import { AddSpaceButton, SpaceCard } from "./space-card";

export const SpaceList = ({
  venueId,
  spaces,
}: {
  venueId: string;
  spaces: Space[];
}) => {
  return (
    <ul className="flex flex-col gap-2 px-4 py-2 sm:px-6 lg:px-8">
      {spaces.map((space) => (
        <SpaceCard space={space} key={space.id} />
      ))}
      <AddSpaceButton venueId={venueId} />
    </ul>
  );
};

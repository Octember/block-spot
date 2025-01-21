import { getAllVenues, useQuery } from "wasp/client/operations";

import { VenueList } from "./venue-list";

import {
  CardContent,
  CardHeader,
  PageCard,
} from "../../client/components/layouts/page-card";
import { AddVenueButton } from "./add-venue/add-venue-button";
import { BulkSpaceCreator } from "./create-spaces";

export default function VenuePage() {
  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <PageCard>
      <CardHeader title="Spaces">
        <AddVenueButton />
        <BulkSpaceCreator />
      </CardHeader>
      <VenueList venues={venues || []} />
    </PageCard>
  );
}

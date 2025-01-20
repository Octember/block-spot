import { getAllVenues, useQuery } from "wasp/client/operations";

import { VenueList } from "./venue-list";

import {
  CardContent,
  CardHeader,
  PageCard,
} from "../../client/components/page-card";
import { AddVenueButton } from "./add-venue/add-venue-button";

export default function VenuePage() {
  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <PageCard>
      <CardHeader title="Venues">
        <AddVenueButton />
      </CardHeader>
      <VenueList venues={venues || []} />
    </PageCard>
  );
}

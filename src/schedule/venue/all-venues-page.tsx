import { getAllVenues, useQuery } from "wasp/client/operations";

import { VenueList } from "./venue-list";

import {
  CardContent,
  CardHeader,
  PageCard,
} from "../../client/components/layouts/page-card";
import { AddVenueButton } from "./add-venue/add-venue-button";
import { BulkSpaceCreator } from "./spaces/bulk-create-spaces";
import { PageLayout } from '../../client/components/layouts/page-layout';

export default function VenuePage() {
  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <PageLayout
      header={{
        title: "Spaces",
        description: "Manage your venues and spaces",
      }}
    >

      <VenueList venues={venues || []} />
    </PageLayout>
  );
}

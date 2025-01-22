import { getAllVenues, useQuery } from "wasp/client/operations";

import { VenueList } from "./venue-list";

import { SidebarLayout } from "../../client/components/layouts/sidebar-layout";

export default function VenuePage() {
  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <SidebarLayout
      header={{
        title: "Spaces",
        description: "Manage your venues and spaces",
      }}
    >
      <VenueList venues={venues || []} />
    </SidebarLayout>
  );
}

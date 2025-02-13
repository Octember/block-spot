import { getAllVenues, useQuery } from "wasp/client/operations";

import { VenueList } from "./venue-list";

import { SidebarLayout } from "../../client/components/layouts/sidebar-layout";
import { AuthUser } from "wasp/auth";

export default function VenuePage({ user }: { user: AuthUser }) {
  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <SidebarLayout
      user={user}
      header={{
        title: "Spaces",
        description: "Manage your venues and spaces",
      }}
    >
      <VenueList venues={venues || []} />
    </SidebarLayout>
  );
}

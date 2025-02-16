import { useParams } from "react-router-dom";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { UpdateVenueForm } from "./update-venue-form";
import { getVenueById, useQuery } from "wasp/client/operations";

export function UpdateVenuePage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return null;

  if (!venueId || !venue) return null;

  return (
    <SidebarLayout
      header={{
        title: venue.name,
        description: "Manage your venue settings and spaces",
      }}
    >
      <UpdateVenueForm venue={venue} />
    </SidebarLayout>
  );
}

import { useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import { useToast } from "../../../client/toast";
import { UpdateVenueForm } from "./update-venue-form";
import {
  PageCard,
  CardContent,
} from "../../../client/components/layouts/page-card";
import { Tabs } from "../../../client/components/tabs";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { PageLayout } from "../../../client/components/layouts/page-layout";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";

export default function VenuePage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <SidebarLayout
      header={{
        title: venue.name,
        description: "Manage your venue settings and spaces",
      }}
    >
      <CardContent>

        <UpdateVenueForm venue={venue} />
      </CardContent>
    </SidebarLayout>
  );
}

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

export default function VenuePage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <PageLayout header={{ title: venue.name, description: 'Manage your venue settings and spaces' }}>
      <CardContent>
        <Tabs
          tabs={[
            { name: "Spaces", href: "#", current: true, icon: XMarkIcon },
            { name: "Settings", href: "#", current: false, icon: XMarkIcon },
            { name: "Bookings", href: "#", current: false, icon: XMarkIcon },
          ]}
        />
        <UpdateVenueForm venue={venue} />
      </CardContent>
    </PageLayout>
  );
}

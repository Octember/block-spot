import { useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import { useToast } from "../../../client/toast";
import { UpdateVenueForm } from "./update-venue-form";
import { PageCard, CardContent } from "../../../client/components/layouts/page-card";

export default function VenuePage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <PageCard>
      <CardContent>
        <UpdateVenueForm venue={venue} />
      </CardContent>
    </PageCard>
  );
}

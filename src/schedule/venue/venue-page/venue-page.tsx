import { Route, Routes, useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import { CardContent } from "../../../client/components/layouts/page-card";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { UpdateVenueForm } from "./update-venue-form";
import { SpaceList } from "../spaces/space-list";
import { Space, Venue } from "wasp/entities";
import { BulkSpaceCreator } from "../spaces/bulk-create-spaces";

export default function VenuePage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <SidebarLayout
            header={{
              title: venue.name,
              description: "Manage your venue settings and spaces",
            }}
          >
            <UpdateVenueForm venue={venue} />
          </SidebarLayout>
        }
      />
      <Route path="/spaces" element={<SpacesPage venue={venue} />} />
    </Routes>
  );
}

const SpacesPage = ({ venue }: { venue: Venue & { spaces: Space[] } }) => {
  return (
    <SidebarLayout
      header={{
        title: venue.name,
        description: "Manage your venue settings and spaces",
        actions: (
          <>
            <BulkSpaceCreator venueId={venue.id} />
          </>
        ),
      }}
    >
      <li className="relative flex flex-col justify-between gap-x-6 py-5 bg-white border border-gray-200 rounded-md">
        <SpaceList venueId={venue.id} spaces={venue.spaces} />
      </li>
    </SidebarLayout>
  );
};

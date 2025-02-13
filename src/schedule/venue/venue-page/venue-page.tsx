import { Route, Routes, useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { BulkSpaceCreator } from "../spaces/bulk-create-spaces";
import { SpaceList } from "../spaces/space-list";
import { HoursAndAvailabilityPage } from "./hours-and-availability";
import { VenueIntegrationsPage } from "./integrations-page";
import { PaymentsPage } from "./payments/payments-page";
import { UpdateVenuePage } from "./update-venue-page";
import { AuthUser } from "wasp/auth";

export default function VenuePage({ user }: { user: AuthUser }) {
  return (
    <Routes>
      <Route path="/" element={<UpdateVenuePage user={user} />} />
      <Route path="/spaces" element={<SpacesPage user={user} />} />
      <Route path="/availability" element={<HoursAndAvailabilityPage user={user} />} />
      <Route path="/integrations" element={<VenueIntegrationsPage user={user} />} />
      <Route path="/payments" element={<PaymentsPage user={user} />} />
    </Routes>
  );
}

const SpacesPage = ({ user }: { user: AuthUser }) => {
  const { venueId } = useParams();
  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return null;

  if (!venueId || !venue) return null;

  return (
    <SidebarLayout
      user={user}
      header={{
        title: venue.name,
        description: "Manage your venue settings and spaces",
        actions: <BulkSpaceCreator venueId={venue.id} />,
      }}
    >
      <li className="relative flex flex-col justify-between gap-x-6 py-5 bg-white border border-gray-200 rounded-md">
        <SpaceList venueId={venue.id} spaces={venue.spaces} />
      </li>
    </SidebarLayout>
  );
};

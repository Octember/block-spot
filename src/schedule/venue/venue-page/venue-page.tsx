import { Route, Routes, useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import LoadingSpinner from "../../../admin/layout/LoadingSpinner";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { BulkSpaceCreator } from "../spaces/bulk-create-spaces";
import { SpaceList } from "../spaces/space-list";
import { HoursAndAvailabilityPage } from "./hours-and-availability";
import { VenueIntegrationsPage } from "./integrations-page";
import { PaymentsPage } from "./payments/payments-page";
import { UpdateVenuePage } from "./update-venue-page";
import RecurringReservationsPage from "../../pages/recurring-reservations/RecurringReservationsPage";

export default function VenuePage() {
  return (
    <Routes>
      <Route path="/" element={<UpdateVenuePage />} />
      <Route path="/spaces" element={<SpacesPage />} />
      <Route path="/availability" element={<HoursAndAvailabilityPage />} />
      <Route path="/integrations" element={<VenueIntegrationsPage />} />
      <Route path="/payments" element={<PaymentsPage />} />
      <Route path="/recurring-reservations" element={<RecurringReservationsPage />} />
    </Routes>
  );
}

const SpacesPage = () => {
  const { venueId } = useParams();
  const {
    data: venue,
    isLoading,
    refetch,
  } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  return (
    <SidebarLayout
      header={{
        title: venue?.name || "Loading...",
        description: "Manage your venue settings and spaces",
        actions: venueId ? <BulkSpaceCreator venueId={venueId} /> : null,
      }}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <li className="relative flex flex-col justify-between gap-x-6 py-5 bg-white border border-gray-200 rounded-md">
          <SpaceList spaces={venue?.spaces || []} refetch={refetch} />
        </li>
      )}
    </SidebarLayout>
  );
};

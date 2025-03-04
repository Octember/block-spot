import { useState } from "react";
import { getUserBookings, getUserOrganizations, useQuery } from "wasp/client/operations";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";
import { Card } from "../../client/components/card";
import { BookingsList } from "./components/BookingsList";
import { BookingTabs } from "./components/BookingTabs";
import { NewBookingCard } from "./components/NewBookingCard";
import { Tabs } from "./types";

export function MyBookingsPage() {
  const { data: organizations } = useQuery(getUserOrganizations);
  const [activeTab, setActiveTab] = useState<Tabs>("upcoming");

  const { data: bookingsData, isLoading } = useQuery(getUserBookings, {
    type: activeTab
  });

  const venueId = organizations?.[0]?.venues?.[0]?.id;

  return (
    <div className="centered-page-content">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        My Bookings
      </h1>

      <BookingTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <Card heading={{ title: activeTab === "upcoming" ? "Upcoming Bookings" : "Past Bookings" }}>
        {isLoading ? (
          <div className="py-6 text-center">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : (
          <BookingsList
            bookings={bookingsData?.bookings || []}
            activeTab={activeTab}
          />
        )}
      </Card>

      <NewBookingCard venueId={venueId} />
    </div>
  );
} 
import { ArrowUpRightIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Button } from "../../../client/components/button";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { BookingType, Tabs } from "../types";

interface BookingsListProps {
  bookings: BookingType[];
  activeTab: Tabs;
}

export const BookingsList = ({ bookings, activeTab }: BookingsListProps) => {
  if (bookings.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500">No {activeTab} bookings found.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {bookings.map((booking) => (
        <div key={booking.id} className="py-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {booking.space.name}
              </h3>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <p>{format(new Date(booking.startTime), "MMMM d, yyyy")}</p>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                <p>{format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")}</p>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Venue: {booking.space.venue.name}
              </p>
              {booking.description && (
                <p className="mt-2 text-sm text-gray-500">
                  {booking.description}
                </p>
              )}
              <div className="mt-2">
                <BookingStatusBadge status={booking.status} />
              </div>
            </div>

            <div className="flex space-x-2">
              {activeTab === "upcoming" && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    ariaLabel="Reschedule booking"
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="warning"
                    size="sm"
                    ariaLabel="Cancel booking"
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowUpRightIcon className="size-4" />}
                ariaLabel="View booking details"
              >
                Details
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 
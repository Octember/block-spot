import { useParams } from "react-router-dom";
import { WeekViewCalendar } from "./calendar/WeekViewCalendar";
import { ScheduleProvider } from "./calendar/providers/schedule-context-provider";
import { VenueProvider } from "./calendar/providers/venue-provider";
import { useAuth } from "wasp/client/auth";

export default function SchedulePage() {
  const { venueId } = useParams();
  const { data: user } = useAuth();

  if (!venueId || !user) return null;

  return (
    <VenueProvider venueId={venueId}>
      <WeekViewCalendar />
    </VenueProvider>
  );
}

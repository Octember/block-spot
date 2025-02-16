import { useParams } from "react-router-dom";
import { WeekViewCalendar } from "./calendar/WeekViewCalendar";
import { VenueProvider } from "./calendar/providers/venue-provider";

export default function SchedulePage() {
  const { venueId } = useParams();

  if (!venueId) return null;

  return (
    <VenueProvider venueId={venueId}>
      <WeekViewCalendar />
    </VenueProvider>
  );
}

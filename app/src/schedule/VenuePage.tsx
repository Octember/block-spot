import { FC } from "react";
import { useParams } from "react-router-dom";
import { useQuery, getVenueInfo } from "wasp/client/operations";
import { WeekViewCalendar } from "./calendar/WeekViewCalendar";

const VenuePage: FC = () => {
  const { venueId } = useParams();
  const { data, isLoading, refetch } = useQuery(getVenueInfo);

  const venue = data?.find((venue) => venue.id === venueId);

  if (!venue) {
    return <div>Venue not found</div>;
  }

  return <WeekViewCalendar venue={venue} />;
};

export default VenuePage;

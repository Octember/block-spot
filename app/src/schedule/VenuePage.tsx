import { FC } from "react";
import { useParams } from "react-router-dom";
import { useQuery, getVenueInfo } from "wasp/client/operations";
import { WeekViewCalendar } from "./WeekViewCalendar";

const VenuePage: FC = () => {

  const { venueId } = useParams();
  const { data, isLoading } = useQuery(getVenueInfo);
  console.log(data);

  const venue = data?.find((venue) => venue.id === venueId);

  if (!venue) {
    return <div>Venue not found</div>
  }

  return (
    <div>
      <WeekViewCalendar />
    </div>
  )
}


export default VenuePage;
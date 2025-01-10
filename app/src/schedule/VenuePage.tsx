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

  return <div className="h-full">
    <WeekViewCalendar venue={venue} />
    <div className="bg-gray-100 border-t border-gray-200 w-screen overflow-hidden px-6 sticky bottom-0 left-0 -mx-8">
      <form className="my-4 flex w-full justify-center">
        <div className="w-80">
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Tell me what you want to do"
            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          />
        </div>
        <button
          type="submit"
          className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
        >
          Save
        </button>
      </form>
    </div>
  </div>
};

export default VenuePage;

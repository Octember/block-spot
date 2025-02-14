import { FC } from "react";
import { formatInTimeZone } from 'date-fns-tz';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useVenueContext } from '../providers/venue-provider';

export const DateSelectButton: FC = () => {
  const { selectedDate, setSelectedDate, venue } = useVenueContext();

  return <button className="px-2 font-bold flex flex-row items-center gap-2">
    {formatInTimeZone(selectedDate, venue.timeZoneId, "MMMM d, yyyy")} <ChevronDownIcon className="size-4" />
  </button>
}
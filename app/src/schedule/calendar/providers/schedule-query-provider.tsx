import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVenueInfo } from 'wasp/client/operations';
import { useSelectedDate } from './date-provider';

const useScheduleQuery = (venueId: string) => {
  const { selectedDate } = useSelectedDate();

  const [result, setResult] = useState<Awaited<ReturnType<typeof getVenueInfo>>>(null);

  function refresh() {
    getVenueInfo({ venueId, selectedDate }).then(setResult);
  }

  useEffect(() => {
    refresh();
  }, [venueId, selectedDate]);

  return { result, refresh }
}

export const ScheduleQueryContext = createContext<{ venue: Awaited<ReturnType<typeof getVenueInfo>>, refresh: () => void }>({ venue: null, refresh: () => { } });

export const ScheduleQueryProvider = ({ children }: { children: React.ReactNode }) => {
  const { venueId } = useParams();
  if (!venueId) {
    return <div>Venue not found</div>;
  }
  const { result: venue, refresh } = useScheduleQuery(venueId);
  return <ScheduleQueryContext.Provider value={{ venue, refresh }}>
    {children}
  </ScheduleQueryContext.Provider>
}

export const useScheduleContext = () => {
  return useContext(ScheduleQueryContext);
}
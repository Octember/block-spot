import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getVenueInfo } from "wasp/client/operations";
import { useSelectedDate } from "./date-provider";
import { useQuery } from "@tanstack/react-query";

const useScheduleQuery = (venueId: string) => {
  const { selectedDate } = useSelectedDate();

  const { data: venue, refetch } = useQuery(
    [getVenueInfo, venueId, selectedDate],
    () =>
      getVenueInfo({
        venueId,
        selectedDate,
      }),
  );

  return {
    result: venue || null,
    refresh: () => {
      refetch();
    },
  };
};

export const ScheduleQueryContext = createContext<{
  venue: NonNullable<Awaited<ReturnType<typeof getVenueInfo>>>;
  refresh: () => void;
}>({ venue: null, refresh: () => { } });

export const ScheduleQueryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { venueId } = useParams();
  if (!venueId) {
    return <div>Venue not found</div>;
  }
  const { result: venue, refresh } = useScheduleQuery(venueId);

  if (!venue) {
    return <div>Venue not found</div>;
  }

  return (
    <ScheduleQueryContext.Provider value={{ venue, refresh }}>
      {children}
    </ScheduleQueryContext.Provider>
  );
};

export const useScheduleContext = () => {
  const { venue, refresh } = useContext(ScheduleQueryContext);

  return { venue, refresh };
};

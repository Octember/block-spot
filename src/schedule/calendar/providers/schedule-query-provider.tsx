import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { getVenueInfo } from "wasp/client/operations";
import { Space } from "wasp/entities";
import { getUnavailabilityBlocks } from "./availability-utils";
import { useSelectedDate } from "./date-provider";

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
  unavailabileBlocks: {
    id: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[];
  refresh: () => void;
  getSpaceById: (spaceId: string) => Space | undefined;
}>({
  // @ts-expect-error idk
  venue: null,
  unavailabileBlocks: [],
  refresh: () => { },
  getSpaceById: () => undefined,
});

export const ScheduleQueryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { venueId } = useParams();
  if (!venueId) {
    return null;
  }

  // Cache to avoid a flicker when the venue is loading
  const lastVenue = useRef<NonNullable<
    Awaited<ReturnType<typeof getVenueInfo>>
  > | null>(null);
  const { result: venue, refresh } = useScheduleQuery(venueId);

  if (venue) {
    lastVenue.current = venue;
  }

  const venueToUse = lastVenue.current || venue;

  const unavailabileBlocks = useMemo(() => venueToUse
    ? getUnavailabilityBlocks(venueToUse)
    : [], [venueToUse]);

  const getSpaceById = useCallback((spaceId: string) => {
    return venueToUse?.spaces.find((space) => space.id === spaceId);
  }, [venueToUse]);

  if (!venueToUse) {
    return null;
  }

  return (
    <ScheduleQueryContext.Provider
      value={{ venue: venueToUse, unavailabileBlocks, refresh, getSpaceById }}
    >
      {children}
    </ScheduleQueryContext.Provider>
  );
};

export const useScheduleContext = () => {
  return useContext(ScheduleQueryContext);
};

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
  isTimeAvailable: (rowIndex: number, columnIndex: number) => boolean;
}>({
  // @ts-expect-error idk
  venue: null,
  unavailabileBlocks: [],
  refresh: () => {},
  getSpaceById: () => undefined,
  isTimeAvailable: () => false,
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

  const { selectedDate } = useSelectedDate();

  // Cache to avoid a flicker when the venue is loading
  const lastVenue = useRef<NonNullable<
    Awaited<ReturnType<typeof getVenueInfo>>
  > | null>(null);
  const { result: venue, refresh } = useScheduleQuery(venueId);

  if (venue) {
    lastVenue.current = venue;
  }

  const venueToUse = lastVenue.current || venue;

  const unavailabileBlocks = useMemo(
    () => (venueToUse ? getUnavailabilityBlocks(venueToUse) : []),
    [venueToUse],
  );

  const getSpaceById = useCallback(
    (spaceId: string) => {
      return venueToUse?.spaces.find((space) => space.id === spaceId);
    },
    [venueToUse],
  );

  const isTimeAvailable = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (!venueToUse) return false;

      // Convert row index to minutes since midnight
      const timeInMinutes = (rowIndex - 2) * 15 + venueToUse.displayStart;
      const timeDate = new Date(selectedDate);
      timeDate.setHours(
        Math.floor(timeInMinutes / 60),
        timeInMinutes % 60,
        0,
        0,
      );

      // Check if time falls within any unavailability block
      const isInUnavailableBlock = unavailabileBlocks.some(
        (block) =>
          timeInMinutes >= block.startTimeMinutes &&
          timeInMinutes < block.endTimeMinutes,
      );

      if (isInUnavailableBlock) return false;

      // Check if there are any reservations at this time
      const space = venueToUse.spaces[columnIndex];
      if (!space) return false;

      const hasOverlappingReservation = space.reservations.some(
        (reservation) => {
          const startTime = new Date(reservation.startTime);
          const endTime = new Date(reservation.endTime);
          return timeDate >= startTime && timeDate < endTime;
        },
      );

      return !hasOverlappingReservation;
    },
    [venueToUse, unavailabileBlocks, selectedDate],
  );

  if (!venueToUse) {
    return null;
  }

  return (
    <ScheduleQueryContext.Provider
      value={{
        venue: venueToUse,
        unavailabileBlocks,
        refresh,
        getSpaceById,
        isTimeAvailable,
      }}
    >
      {children}
    </ScheduleQueryContext.Provider>
  );
};

export const useScheduleContext = () => {
  return useContext(ScheduleQueryContext);
};

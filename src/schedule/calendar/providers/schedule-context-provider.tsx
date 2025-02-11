import { format, isValid, parseISO } from "date-fns";
import { createContext, useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from "react-router-dom";
import { Space, Venue } from "wasp/entities";
import { getStartOfDay, localToUTC } from "../date-utils";
import { useQuery } from "wasp/client/operations";
import { getVenueInfo } from "wasp/client/operations";
import React from 'react';
import { getUnavailabilityBlocks } from './availability-utils';


interface ScheduleContextValue {
  // Date-related
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Venue-related
  unavailabileBlocks: {
    id: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[];
  refresh: () => void;
  venue: NonNullable<Awaited<ReturnType<typeof getVenueInfo>>>;
  isLoading: boolean;
  getSpaceById: (id: string) => Space | undefined;
  isTimeAvailable: (rowIndex: number, columnIndex: number) => boolean;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

function getDateOrDefault(date: string | null, venue: Venue) {
  if (!date) {
    return getStartOfDay(new Date(), venue);
  }

  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return getStartOfDay(new Date(), venue);
  }

  return getStartOfDay(parsedDate, venue);
}

interface ScheduleProviderProps {
  children: React.ReactNode;
  venueId: string;
}

export function ScheduleProvider({ children, venueId }: ScheduleProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");
  const initialDate = urlDate ? parseISO(urlDate) : new Date();

  // Keep track of current query parameters
  const queryInput = useRef({
    venueId,
    selectedDate: initialDate
  });

  // Fetch venue data with the current date
  const { data: venue, refetch, isLoading } = useQuery(getVenueInfo, queryInput.current);

  // Update venue data when date changes
  useEffect(() => {
    if (urlDate) {
      const newDate = parseISO(urlDate);
      queryInput.current = {
        venueId,
        selectedDate: newDate
      };
      refetch();
    }
  }, [urlDate, venueId, refetch]);

  const currentDate = venue ? getDateOrDefault(urlDate, venue) : initialDate;

  const getSpaceById = useMemo(
    () => (id: string) => venue?.spaces.find((space: Space) => space.id === id),
    [venue?.spaces]
  );

  const unavailabileBlocks = useMemo(
    () => (venue ? getUnavailabilityBlocks(venue) : []),
    [venue],
  );

  const isTimeAvailable = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (!venue) return false;

      // Convert row index to minutes since midnight
      const timeInMinutes = (rowIndex - 2) * 15 + venue.displayStart;
      const timeDate = new Date(currentDate);
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
      const space = venue.spaces[columnIndex];
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
    [venue, unavailabileBlocks, currentDate],
  );

  if (!venue) {
    return null;
  }

  const value: ScheduleContextValue = {
    selectedDate: currentDate,
    setSelectedDate: (date: Date) => {
      const utcDate = localToUTC(date, venue);
      setSearchParams((prev) => {
        prev.set("selected_date", format(utcDate, "yyyy-MM-dd"));
        return prev;
      });
    },
    venue,
    unavailabileBlocks,
    refresh: refetch,
    isLoading,
    getSpaceById,
    isTimeAvailable,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useScheduleContext() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useScheduleContext must be used within a ScheduleProvider");
  }
  return context;
} 
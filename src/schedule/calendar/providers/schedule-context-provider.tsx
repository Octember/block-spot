import { isValid, parseISO } from "date-fns";
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { getVenueSchedule, useQuery } from "wasp/client/operations";
import { Venue } from "wasp/entities";
import { getStartOfDay } from "../date-utils";
import { useVenueContext } from "./venue-provider";


interface ScheduleContextValue {
  refresh: () => void;
  spaces: NonNullable<Awaited<ReturnType<typeof getVenueSchedule>>>;
  isLoading: boolean;
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
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [searchParams] = useSearchParams();
  const { unavailabileBlocks, venue } = useVenueContext();

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");
  const initialDate = urlDate ? parseISO(urlDate) : new Date();

  // Keep track of current query parameters
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const { data: spaces, refetch, isLoading } = useQuery(getVenueSchedule, {
    venueId: venue.id,
    selectedDate
  });

  // Effect to update selectedDate when URL changes
  useEffect(() => {
    if (!urlDate) return;
    const newDate = parseISO(urlDate);

    if (newDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(newDate);
    }
  }, [urlDate]);

  const currentDate = getDateOrDefault(urlDate, venue);

  const isTimeAvailable = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (!venue || !spaces) return false;

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
      const space = spaces[columnIndex];
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
    [venue, currentDate],
  );

  if (!venue) {
    return null;
  }

  const value: ScheduleContextValue = {
    spaces: spaces ?? [],
    refresh: () => {
      refetch();
    },
    isLoading,
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
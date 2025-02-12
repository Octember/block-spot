import { format, isValid, parseISO, startOfToday } from "date-fns";
import React, { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from "react-router-dom";
import { getVenueSchedule, useQuery } from "wasp/client/operations";
import { Venue, Space } from "wasp/entities";
import { getStartOfDay, localToUTC } from "../date-utils";
import { useVenueContext } from "./venue-provider";
import { toDate } from 'date-fns-tz';
import { getVenueInfo } from "wasp/client/operations";


interface ScheduleContextValue {
  refresh: () => void;
  spaces: NonNullable<Awaited<ReturnType<typeof getVenueSchedule>>>;
  isLoading: boolean;
  isTimeAvailable: (rowIndex: number, columnIndex: number) => boolean;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

function getDateOrDefault(dateStr: string | null, venue: Venue): Date {
  if (!dateStr) {
    // Create today at midnight in venue's timezone
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T00:00:00`;
    return toDate(todayStr, { timeZone: venue.timeZoneId });
  }

  // Parse the date string and create it at midnight in venue's timezone
  const parsedDate = parseISO(dateStr);
  if (!isValid(parsedDate)) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T00:00:00`;
    return toDate(todayStr, { timeZone: venue.timeZoneId });
  }

  // Create the selected date at midnight in venue's timezone
  return toDate(`${dateStr}T00:00:00`, { timeZone: venue.timeZoneId });
}

interface ScheduleProviderProps {
  children: React.ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [searchParams] = useSearchParams();
  const { unavailabileBlocks, venue } = useVenueContext();

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");
  const initialDate = urlDate ? parseISO(urlDate) : startOfToday();

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
  console.log("currentDate", currentDate);

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
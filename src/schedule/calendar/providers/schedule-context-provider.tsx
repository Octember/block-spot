import { isValid, parseISO, startOfToday } from "date-fns";
import { toDate } from "date-fns-tz";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { getVenueSchedule, useQuery } from "wasp/client/operations";
import { Venue } from "wasp/entities";
import { useVenueContext } from "./venue-provider";
import {
  getTimeFromRowIndex,
  useGetTimeFromRowIndex,
} from "../reservations/utilities";

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
    const date = toDate(now, { timeZone: venue.timeZoneId });
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Parse the date string and create it at midnight in venue's timezone
  const parsedDate = parseISO(dateStr);
  if (!isValid(parsedDate)) {
    const now = new Date();
    const date = toDate(now, { timeZone: venue.timeZoneId });
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Create the selected date at midnight in venue's timezone
  const date = toDate(parsedDate, { timeZone: venue.timeZoneId });
  date.setHours(0, 0, 0, 0);
  return date;
}

interface ScheduleProviderProps {
  children: React.ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [searchParams] = useSearchParams();
  const { unavailabileBlocks, venue } = useVenueContext();

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");

  // Get the date in venue's timezone
  const currentDate = getDateOrDefault(urlDate, venue);

  const {
    data: spaces,
    refetch,
    isLoading,
  } = useQuery(getVenueSchedule, {
    venueId: venue.id,
    selectedDate: currentDate,
  });

  const getTimeFromRow = useCallback(
    (rowIndex: number, date?: Date) =>
      getTimeFromRowIndex(venue, rowIndex, date ?? currentDate),
    [venue, currentDate],
  );

  const isTimeAvailable = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (!venue || !spaces) return false;

      // Convert row index to minutes since midnight
      const timeDate = getTimeFromRow(rowIndex, currentDate);
      const timeInMinutes = timeDate.getHours() * 60 + timeDate.getMinutes();

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
    [venue, currentDate, spaces, unavailabileBlocks],
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
    throw new Error(
      "useScheduleContext must be used within a ScheduleProvider",
    );
  }
  return context;
}

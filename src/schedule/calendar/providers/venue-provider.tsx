import { getVenueDetails, useQuery } from "wasp/client/operations";

import { isValid, parseISO, startOfDay, startOfToday } from "date-fns";
import {
  format,
  formatInTimeZone,
  fromZonedTime,
  toZonedTime,
} from "date-fns-tz";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { Space, Venue } from "wasp/entities";
import { getUnavailabilityBlocks } from "./availability-utils";

interface VenueContext {
  // Date-related
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;

  // Venue-related
  unavailabileBlocks: {
    id: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
  }[];
  venue: NonNullable<Awaited<ReturnType<typeof getVenueDetails>>>;
  isLoading: boolean;
  getSpaceById: (id: string) => Space | undefined;
}

const VenueContext = createContext<VenueContext | null>(null);

export function getDateOrDefault(date: string | null, venue: Venue): Date {
  if (!date) {
    return toZonedTime(startOfToday(), venue.timeZoneId);
  }

  const parsed = parseISO(date);
  if (!isValid(parsed)) {
    return toZonedTime(startOfToday(), venue.timeZoneId);
  }

  // fromZonedTime converts the local time in the specified time zone to the equivalent UTC Date.
  return toZonedTime(parsed, venue.timeZoneId);
}

interface VenueProviderProps {
  children: React.ReactNode;
  venueId: string;
}

export function VenueProvider({ children, venueId }: VenueProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: venue, isLoading } = useQuery(getVenueDetails, {
    venueId,
  });

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");

  // Initialize with current date in venue's timezone if available
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Update selectedDate when venue is loaded or URL changes
  useEffect(() => {
    if (!venue) return;
    const newDate = getDateOrDefault(urlDate, venue);
    setSelectedDate(newDate);
  }, [urlDate, venue]);

  const getSpaceById = useCallback(
    (id: string) => venue?.spaces.find((space: Space) => space.id === id),
    [venue?.spaces],
  );

  const unavailabileBlocks = useMemo(
    () => (venue ? getUnavailabilityBlocks(venue) : []),
    [venue],
  );

  if (!venue) {
    return null;
  }

  const value: VenueContext = {
    selectedDate,
    setSelectedDate: (date: Date) => {
      setSearchParams((prev) => {
        prev.set("selected_date", format(date, "yyyy-MM-dd"));
        return prev;
      });
    },
    unavailabileBlocks,
    venue,
    isLoading,
    getSpaceById,
  };

  return (
    <VenueContext.Provider value={value}>{children}</VenueContext.Provider>
  );
}

export function useVenueContext() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenueContext must be used within a VenueProvider");
  }
  return context;
}

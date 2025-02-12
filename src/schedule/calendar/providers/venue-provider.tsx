import { getVenueDetails, useQuery } from "wasp/client/operations";

import { format, isValid, parseISO } from "date-fns";
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
import { getStartOfDay, localToUTC, UTCToLocal } from "../date-utils";
import { getUnavailabilityBlocks } from "./availability-utils";
import { toDate } from "date-fns-tz";

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

function getDateOrDefault(date: string | null, venue: Venue) {
  if (!date) {
    // Create today at midnight in venue's timezone
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00:00`;
    return toDate(todayStr, { timeZone: venue.timeZoneId });
  }

  // Parse the date string and create it at midnight in venue's timezone
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00:00`;
    return toDate(todayStr, { timeZone: venue.timeZoneId });
  }

  // Create the selected date at midnight in venue's timezone
  return toDate(`${date}T00:00:00`, { timeZone: venue.timeZoneId });
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
      // Convert the input date to midnight in venue's timezone
      const venueDate = getDateOrDefault(format(date, "yyyy-MM-dd"), venue);
      setSelectedDate(venueDate);
      setSearchParams((prev) => {
        prev.set("selected_date", format(venueDate, "yyyy-MM-dd"));
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

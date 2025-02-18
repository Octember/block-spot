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


interface VenueProviderProps {
  children: React.ReactNode;
  venueId: string;
}


export function parseDateOrDefault(dateStr: string | null, timeZone: string): Date {
  if (!dateStr) return toZonedTime(startOfToday(), timeZone);

  const parsed = parseISO(dateStr);

  if (!isValid(parsed)) return toZonedTime(startOfToday(), timeZone);


  return parsed
}


export function VenueProvider({ children, venueId }: VenueProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: venue, isLoading } = useQuery(getVenueDetails, { venueId });

  // Compute initial selectedDate before state to avoid unnecessary re-renders
  const urlDate = searchParams.get("selected_date");
  const initialDate = parseDateOrDefault(urlDate, venue?.timeZoneId ?? "UTC");
  const [selectedDate, setSelectedDate] = useState(initialDate);



  const updateDate = (date: Date) => {
    if (date.getTime() !== selectedDate.getTime()) {
      setSelectedDate(date);
      setSearchParams({ selected_date: format(date, "yyyy-MM-dd") });
    }
  };

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
      updateDate(startOfDay(date));
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

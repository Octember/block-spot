import { getVenueDetails, useQuery } from 'wasp/client/operations';

import { format, isValid, parseISO } from "date-fns";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { Space, Venue } from "wasp/entities";
import { getStartOfDay, localToUTC } from "../date-utils";
import { getUnavailabilityBlocks } from './availability-utils';

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
    return getStartOfDay(new Date(), venue);
  }

  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    return getStartOfDay(new Date(), venue);
  }

  return getStartOfDay(parsedDate, venue);
}

interface VenueProviderProps {
  children: React.ReactNode;
  venueId: string;
}

export function VenueProvider({ children, venueId }: VenueProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get the current date from URL params
  const urlDate = searchParams.get("selected_date");
  const initialDate = urlDate ? parseISO(urlDate) : new Date();

  // Keep track of current query parameters
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const { data: venue, isLoading } = useQuery(getVenueDetails, {
    venueId,
  });

  // Effect to update selectedDate when URL changes
  useEffect(() => {
    if (!urlDate) return;
    const newDate = parseISO(urlDate);

    if (newDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(newDate);
    }
  }, [urlDate]);


  const currentDate = venue ? getDateOrDefault(urlDate, venue) : initialDate;

  const getSpaceById = useMemo(
    () => (id: string) => venue?.spaces.find((space: Space) => space.id === id),
    [venue?.spaces]
  );

  const unavailabileBlocks = useMemo(
    () => (venue ? getUnavailabilityBlocks(venue) : []),
    [venue],
  );


  if (!venue) {
    return null;
  }


  const value: VenueContext = {
    selectedDate: currentDate,
    setSelectedDate: (date: Date) => {
      const utcDate = localToUTC(date, venue);
      setSearchParams((prev) => {
        prev.set("selected_date", format(utcDate, "yyyy-MM-dd"));
        return prev;
      });
    },
    unavailabileBlocks,
    venue,
    isLoading,
    getSpaceById,
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenueContext() {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useVenueContext must be used within a VenueProvider");
  }
  return context;
} 
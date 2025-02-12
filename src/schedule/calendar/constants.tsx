import { startOfDay } from "date-fns";
import { format, formatInTimeZone, getTimezoneOffset, toDate, toZonedTime } from "date-fns-tz";
import { useMemo } from "react";
import { Venue } from "wasp/entities";
import { useVenueContext } from './providers/venue-provider';


export const getUserTimeZoneAbbreviation = () => {
  return format(new Date(), "zzz", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

export const useVenueTimeZoneAbbreviation = () => {
  const { venue } = useVenueContext();
  return getTimeZoneAbbreviation(venue.timeZoneId);
}

export const getTimeZoneAbbreviation = (timeZone: string) => {
  return format(new Date(), "zzz", { timeZone });
}

export const useIsTimeZoneDifferent = () => {
  const { venue } = useVenueContext();
  return useMemo(() => isTimeZoneDifferent(venue.timeZoneId), [venue.timeZoneId]);
}

function isTimeZoneDifferent(referenceTZ: string) {
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get UTC offsets at the current moment
  const now = new Date();
  const referenceOffset = getTimezoneOffset(referenceTZ, now);
  const userOffset = getTimezoneOffset(userTZ, now);

  return userOffset !== referenceOffset;
}

function generateTimeLabels(venue?: Venue, formatType: "short" | "long" = "short"): string[] {
  const labels: string[] = [];
  const formatString = formatType === "long" ? "h:mm a" : "h a";

  // Start with midnight in UTC
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    if (venue) {
      // Create a date at the current hour in venue's timezone
      const date = toDate(baseDate, { timeZone: venue.timeZoneId });
      date.setHours(hour, 0, 0, 0);

      // Format time in venue's timezone
      const venueTime = format(date, formatString, { timeZone: venue.timeZoneId });

      if (isTimeZoneDifferent(venue.timeZoneId)) {
        // Get the user's timezone
        const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Create a new date in the user's timezone at the same absolute time
        const userDate = new Date(date.toLocaleString('en-US', { timeZone: userTZ }));
        const userTime = format(userDate, formatString, { timeZone: userTZ });

        labels.push(`${userTime} (${venueTime})`);
      } else {
        labels.push(venueTime);
      }
    } else {
      const date = new Date(baseDate);
      date.setHours(hour, 0, 0, 0);
      labels.push(format(date, formatString));
    }
  }

  return labels;
}

function generate15MinuteLabels(venue: Venue): string[] {
  const labels: string[] = [];
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const date = toDate(baseDate, { timeZone: venue.timeZoneId });
      date.setHours(hour, minute, 0, 0);
      labels.push(format(date, "h:mm a", { timeZone: venue.timeZoneId }));
    }
  }

  return labels;
}

export function useTimeLabels() {
  const { venue } = useVenueContext();

  const labels = generateTimeLabels(venue);
  return labels.slice(venue.displayStart / 60, venue.displayEnd / 60);
}

function generateTimeLabelsAndZones(venue: Venue, formatType: "short" | "long" = "short"): React.ReactNode[] {
  const labels: React.ReactNode[] = [];
  const formatString = formatType === "long" ? "h:mm a" : "h a";
  const isDifferent = isTimeZoneDifferent(venue.timeZoneId);
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Get the timezone offset in minutes for both timezones
  const now = new Date();
  const venueOffset = getTimezoneOffset(venue.timeZoneId, now);

  // Create a UTC base date
  const utcBase = new Date();
  utcBase.setUTCHours(0, 0, 0, 0);

  // Adjust for venue timezone to start at venue's midnight
  const venueAdjustedBase = new Date(utcBase.getTime() - venueOffset);

  for (let hour = 0; hour < 24; hour++) {
    const date = new Date(venueAdjustedBase.getTime() + hour * 60 * 60 * 1000);

    // Format times in respective timezones
    const venueTime = formatInTimeZone(date, venue.timeZoneId, formatString);

    if (isDifferent) {
      const userTime = formatInTimeZone(date, userTZ, formatString);

      labels.push(
        <span className="flex items-center justify-between pl-2">
          <span className="text-xs text-gray-500 items-center mt-[1px]">
            {userTime}
          </span>
          <span className="font-bold text-gray-700 items-center">
            {venueTime}
          </span>
        </span>
      );
    } else {
      labels.push(venueTime);
    }
  }

  return labels;
}

export function useTimeLabelsAndZones() {
  const { venue } = useVenueContext();
  const labels = generateTimeLabelsAndZones(venue);

  return labels.slice(venue.displayStart / 60, venue.displayEnd / 60);
}

export function useTimeLabelsNoVenue() {
  const labels = generateTimeLabels(undefined);
  return labels;
}

export function useTimeLabelsLong() {
  const { venue } = useVenueContext();
  return generateTimeLabels(venue, "long");
}

export function useTimeLabelsLong15Minutes() {
  const { venue } = useVenueContext();
  return generate15MinuteLabels(venue);
}

import { Venue } from "wasp/entities";
import { formatTimeWithZone } from "./date-utils";
import { useVenueContext } from './providers/venue-provider';
import { getTimezoneOffset, format } from "date-fns-tz";
import { useMemo } from "react";

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
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const formatString = formatType === "long" ? "h:mm a" : "h a";

  for (let hour = 0; hour < 24; hour++) {
    date.setHours(hour, 0, 0, 0);
    if (venue) {
      const venueTime = formatTimeWithZone(date, formatString, venue)

      if (isTimeZoneDifferent(venue.timeZoneId)) {
        labels.push(`${venueTime} (${format(date, formatString)} ${getUserTimeZoneAbbreviation()})`);
      } else {
        labels.push(venueTime);
      }

    } else {
      labels.push(format(date, formatString));
    }
  }

  return labels;
}

function generate15MinuteLabels(venue: Venue): string[] {
  const labels: string[] = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      date.setHours(hour, minute, 0, 0);
      labels.push(formatTimeWithZone(date, "h:mm a", venue));
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
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const formatString = formatType === "long" ? "h:mm a" : "h a";

  for (let hour = 0; hour < 24; hour++) {
    date.setHours(hour, 0, 0, 0);
    if (venue) {
      const venueTime = formatTimeWithZone(date, formatString, venue)

      if (isTimeZoneDifferent(venue.timeZoneId)) {
        labels.push(
          <span className="flex items-center justify-between pl-2">
            <span className="text-xs text-gray-500">
              {format(date, formatString)}
            </span>
            <span className="font-bold text-gray-700">
              {venueTime}
            </span>
          </span>
        );
      } else {
        labels.push(venueTime);
      }

    } else {
      labels.push(format(date, formatString));
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

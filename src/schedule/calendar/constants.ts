import { Venue } from "wasp/entities";
import { formatTimeWithZone } from "./date-utils";
import { useVenueContext } from './providers/venue-provider';

function generateTimeLabels(venue: Venue, format: "short" | "long" = "short"): string[] {
  const labels: string[] = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    date.setHours(hour, 0, 0, 0);
    labels.push(formatTimeWithZone(date, format === "long" ? "h:mm a" : "h a", venue));
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

export function useTimeLabelsLong() {
  const { venue } = useVenueContext();
  return generateTimeLabels(venue, "long");
}

export function useTimeLabelsLong15Minutes() {
  const { venue } = useVenueContext();
  return generate15MinuteLabels(venue);
}

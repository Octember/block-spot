import { useScheduleContext } from "./providers/schedule-query-provider";

export const timeLabels = [
  "12AM",
  "1AM",
  "2AM",
  "3AM",
  "4AM",
  "5AM",
  "6AM",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
  "10PM",
  "11PM",
];

export function useTimeLabels() {
  const { venue } = useScheduleContext();

  return timeLabels.slice(venue.displayStartHour, venue.displayEndHour);
}
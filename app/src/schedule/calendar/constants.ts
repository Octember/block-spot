import { useScheduleContext } from "./providers/schedule-query-provider";

export const timeLabelsLong = [
  "12:00AM",
  "1:00AM",
  "2:00AM",
  "3:00AM",
  "4:00AM",
  "5:00AM",
  "6:00AM",
  "7:00AM",
  "8:00AM",
  "9:00AM",
  "10:00AM",
  "11:00AM",
  "12:00PM",
  "1:00PM",
  "2:00PM",
  "3:00PM",
  "4:00PM",
  "5:00PM",
  "6:00PM",
  "7:00PM",
  "8:00PM",
  "9:00PM",
  "10:00PM",
  "11:00PM",
];

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

  return timeLabels.slice(venue.displayStart / 60, venue.displayEnd / 60);
}

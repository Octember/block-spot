import {
  addMinutes,
  differenceInMinutes,
  isAfter,
  isBefore,
  isWithinInterval,
} from "date-fns";
import { Reservation, Venue } from "wasp/entities";
import { MinutesPerSlot } from "./constants";
import { useScheduleContext } from "../providers/schedule-query-provider";

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);
  return Math.ceil(duration / MinutesPerSlot);
}

export function getRowIndex(venue: Venue, time: Date) {
  return (
    Math.ceil(
      time.getHours() * (60 / MinutesPerSlot) +
        time.getMinutes() / MinutesPerSlot -
        venue.displayStart / MinutesPerSlot,
    ) + 2
  );
}

export function getTimeFromRowIndex(venue: Venue, rowIndex: number): Date {
  const totalMinutes =
    (rowIndex + venue.displayStart / MinutesPerSlot) * MinutesPerSlot;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const result = new Date();
  result.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, and milliseconds
  return result;
}

export function isWithinReservation(
  venue: Venue,
  rowIndex: number,
  rowSpan: number,
  target: Reservation,
) {
  const startTime = getTimeFromRowIndex(venue, rowIndex);
  const endTime = addMinutes(startTime, rowSpan * MinutesPerSlot);

  const result =
    isAfter(endTime, target.startTime) && isBefore(startTime, target.endTime);

  return result;
}

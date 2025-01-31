import {
  addMinutes,
  differenceInMinutes,
  isAfter,
  isBefore
} from "date-fns";
import { Reservation, Venue } from "wasp/entities";
import { MinutesPerSlot } from "./constants";

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);

  const result = Math.ceil(duration / MinutesPerSlot);
  return result;
}

// Magic number 2 is to account for the header row and the 1 based index of the rows

const HEADER_ROW_COUNT = 2;

export function getRowIndex(venue: Venue, time: Date) {
  const rowIndex =
    Math.ceil(
      time.getHours() * (60 / MinutesPerSlot) +
        time.getMinutes() / MinutesPerSlot -
        venue.displayStart / MinutesPerSlot,
    ) + HEADER_ROW_COUNT;

  if (rowIndex <= 0) {
    return 1;
  }

  return rowIndex;
}

export function getRowIndexFromMinutes(venue: Venue, minutes: number) {
  const result =
    Math.ceil((minutes - venue.displayStart) / MinutesPerSlot) +
    HEADER_ROW_COUNT;

  if (result <= 0) {
    return 1;
  }

  return result;
}

export function getTimeFromRowIndex(venue: Venue, rowIndex: number): Date {
  const totalMinutes =
    (rowIndex - HEADER_ROW_COUNT) * MinutesPerSlot + venue.displayStart;
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
  const rawStartTime = getTimeFromRowIndex(venue, rowIndex + 1);
  const rawEndTime = addMinutes(rawStartTime, rowSpan * MinutesPerSlot);

  const { startTime, endTime } = setTimesOnDate(
    rawStartTime,
    rawEndTime,
    target.startTime,
  );

  const result =
    isAfter(endTime, target.startTime) && isBefore(startTime, target.endTime);

  return result;
}

export function setTimesOnDate(startTime: Date, endTime: Date, targetDate: Date): {
  startTime: Date;
  endTime: Date;
} {
  const result = new Date(targetDate);
  return {
    startTime: new Date(result.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0)),
    endTime: new Date(result.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0))
  }
}

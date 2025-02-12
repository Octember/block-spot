import { addMinutes, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { Reservation, Venue } from "wasp/entities";
import { localToUTC, UTCToLocal } from "../date-utils";
import { toDate } from 'date-fns-tz';
import { useVenueContext } from "../providers/venue-provider";
import { useCallback } from "react";

// Constants specific to reservation grid
const HEADER_ROW_COUNT = 2;
const MinutesPerSlot = 15;

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);

  const result = Math.ceil(duration / MinutesPerSlot);
  return result;
}

export function getRowIndex(venue: Venue, time: Date) {
  // Convert to local time for display calculations
  const localTime = UTCToLocal(time, venue);
  
  const rowIndex =
    Math.ceil(
      localTime.getHours() * (60 / MinutesPerSlot) +
        localTime.getMinutes() / MinutesPerSlot -
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

export function getTimeFromRowIndex(venue: Venue, rowIndex: number, selectedDate: Date): Date {
  // Calculate total minutes from row index
  const totalMinutes =
    (rowIndex - HEADER_ROW_COUNT) * MinutesPerSlot + venue.displayStart;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Create a new date in the venue's timezone at midnight
  const result = toDate(selectedDate, { timeZone: venue.timeZoneId });
  
  // Set the hours and minutes while preserving the date
  result.setHours(hours, minutes, 0, 0);
  
  return result;
}

export function useGetTimeFromRowIndex() {
  const { venue, selectedDate } = useVenueContext();
  return useCallback(
    (rowIndex: number) => getTimeFromRowIndex(venue, rowIndex, selectedDate),
    [venue, selectedDate],
  );
}

export function isWithinReservation(
  venue: Venue,
  rowIndex: number,
  rowSpan: number,
  target: Reservation,
) {
  const rawStartTime = getTimeFromRowIndex(venue, rowIndex + 1, target.startTime);
  const rawEndTime = addMinutes(rawStartTime, rowSpan * MinutesPerSlot);

  const { startTime, endTime } = setTimesOnDate(
    rawStartTime,
    rawEndTime,
    target.startTime,
    venue
  );

  const result =
    isAfter(endTime, target.startTime) && isBefore(startTime, target.endTime);

  return result;
}

export function setTimesOnDate(
  startTime: Date,
  endTime: Date,
  targetDate: Date,
  venue: Venue,
): {
  startTime: Date;
  endTime: Date;
} {
  const localTargetDate = UTCToLocal(targetDate, venue);
  const localStartTime = UTCToLocal(startTime, venue);
  const localEndTime = UTCToLocal(endTime, venue);

  const result = new Date(localTargetDate);
  return {
    startTime: localToUTC(
      new Date(
        result.setHours(
          localStartTime.getHours(),
          localStartTime.getMinutes(),
          0,
          0,
        ),
      ),
      venue
    ),
    endTime: localToUTC(
      new Date(
        result.setHours(
          localEndTime.getHours(),
          localEndTime.getMinutes(),
          0,
          0,
        ),
      ),
      venue
    ),
  };
}

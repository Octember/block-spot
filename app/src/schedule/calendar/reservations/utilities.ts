import { addMinutes, differenceInMinutes, isAfter, isBefore, isWithinInterval } from "date-fns";
import { Reservation } from "wasp/entities";
import { MinutesPerSlot } from "./constants";
import { useTimeLabels } from "../constants";
import { useScheduleContext } from "../providers/schedule-query-provider";

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);
  return Math.ceil(duration / MinutesPerSlot);
}

export function getRowIndex(time: Date) {
  const { venue } = useScheduleContext();
  if (!venue) throw new Error("Venue not found");

  console.log(time.getHours(), time.getMinutes(), venue.displayStartHour);

  console.log(time)
  console.log("One", time.getHours() * (60 / MinutesPerSlot));
  console.log("Two", time.getMinutes() / MinutesPerSlot);
  console.log("Three", venue.displayStartHour * (60 / MinutesPerSlot));

  return Math.ceil(time.getHours() * (60 / MinutesPerSlot) +
    time.getMinutes() / MinutesPerSlot -
    venue.displayStartHour * (60 / MinutesPerSlot)) + 2;
}

export function getTimeFromRowIndex(rowIndex: number): Date {
  const { venue } = useScheduleContext();

  const totalMinutes = (rowIndex + 3 + venue.displayStartHour * (60 / MinutesPerSlot)) * MinutesPerSlot;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const result = new Date();
  result.setHours(hours, minutes, 0, 0); // Set hours, minutes, seconds, and milliseconds
  return result;
}

export function isWithinReservation(rowIndex: number, rowSpan: number, target: Reservation) {
  const startTime = getTimeFromRowIndex(rowIndex);
  const endTime = addMinutes(startTime, rowSpan * MinutesPerSlot);

  const result = isAfter(endTime, target.startTime) && isBefore(startTime, target.endTime);

  return result;
}

import { differenceInMinutes } from "date-fns";
import { Reservation } from "wasp/entities";

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);
  return Math.ceil(duration / 30);
}
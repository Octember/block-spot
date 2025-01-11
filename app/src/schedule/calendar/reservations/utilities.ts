import { differenceInMinutes } from "date-fns";
import { Reservation } from "wasp/entities";
import { MinutesPerSlot } from "./constants";

export function getRowSpan(reservation: Reservation) {
  const start = reservation.startTime;
  const end = reservation.endTime;
  const duration = differenceInMinutes(end, start);
  return Math.ceil(duration / MinutesPerSlot);
}

export function getRowIndex(reservation: Reservation) {
  return Math.ceil(reservation.startTime.getHours() * (60 / MinutesPerSlot) +
    reservation.startTime.getMinutes() / MinutesPerSlot -
    7 * (60 / MinutesPerSlot));
}

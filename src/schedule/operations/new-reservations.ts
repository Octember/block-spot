import { PaymentRule, Space, Venue } from "wasp/entities";
import { HttpError } from "wasp/server";
import { localToUTC } from "../calendar/date-utils";

export function getStartEndTime(start: Date, end: Date, venue?: Venue) {
  if (!venue) {
    throw new HttpError(404, "Venue not found");
  }

  const startTime = localToUTC(new Date(start), venue);
  startTime.setSeconds(0, 0);
  const endTime = localToUTC(new Date(end), venue);
  endTime.setSeconds(0, 0);

  if (startTime >= endTime) {
    throw new HttpError(400, "Start time must be before end time");
  }

  return { startTime, endTime };
}

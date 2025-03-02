import { useMemo } from "react";
import { Reservation } from "wasp/entities";
import { formatTimeWithZone } from "../date-utils";
import { getReservationDurationInSlots } from "./utilities";
import { LuUserCircle } from "react-icons/lu";
import { useVenueContext } from "../providers/venue-provider";

export const ReservationDescription = ({
  reservation,
  startTime,
  endTime,
}: {
  reservation: Reservation;
  startTime: Date;
  endTime: Date;
}) => {
  const { venue } = useVenueContext();
  const numSlots = useMemo(
    () => getReservationDurationInSlots(reservation),
    [reservation],
  );

  const timeSection = useMemo(() => {
    if (numSlots < 1) {
      return null;
    }

    return (
      <p className="line-clamp-2 text-wrap">
        <time dateTime={reservation.startTime.toISOString()}>
          {formatTimeWithZone(startTime, "h:mm", venue)} -{" "}
          {formatTimeWithZone(endTime, "h:mm a", venue)}
        </time>
      </p>
    );
  }, [reservation, startTime, endTime]);

  const titleSection = useMemo(() => {
    if (!reservation.description) {
      return null;
    }
    return (
      // Needs to be max-w-30 so the name doesn't stretch the slot
      <p className="font-bold text-gray-900 max-w-30 text-ellipsis whitespace-nowrap overflow-hidden">
        {reservation.description}
      </p>
    );
  }, [reservation.description]);

  const sectionsToRender = useMemo(
    () => [titleSection, timeSection].filter(Boolean).slice(0, numSlots / 2),
    [titleSection, timeSection, reservation, numSlots],
  );

  if (numSlots === 1) {
    return (
      <div className="flex flex-row gap-2 items-start justify-between overflow-hidden max-h-full">
        <div className="flex flex-row h-full">
          <LuUserCircle className="size-3 self-center" />
        </div>

        <div className="flex flex-col text-gray-700 h-full">
          <div className="self-center leading-none pt-px h-full">
            {timeSection}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-row gap-2 overflow-hidden max-h-full">
      <div className="pt-1">
        <LuUserCircle className="size-3" />
      </div>
      <div className="flex flex-col text-gray-700">
        {sectionsToRender.map((section, index) => (
          <div key={index}>{section}</div>
        ))}
      </div>
    </div>
  );
};

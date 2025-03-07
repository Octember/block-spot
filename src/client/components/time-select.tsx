import { format } from "date-fns";
import { forwardRef } from "react";
import { Venue } from "wasp/entities";
import { formatTimeWithZone } from "../../schedule/calendar/date-utils";

interface TimeSelectProps {
  value: Date;
  onChange: (hour: number, minute: number) => void;
  venue: Venue;
}

export const TimeSelect = forwardRef<HTMLSelectElement, TimeSelectProps>(
  ({ value, onChange, venue }, ref) => {
    return (
      <select
        ref={ref}
        className="bg-transparent rounded-lg focus:ring-0 cursor-pointer "
        onChange={(e) => {
          const [hour, minute] = e.target.value.split(":");
          onChange(Number(hour), Number(minute));
        }}
        value={format(value, "HH:mm")}
      >
        {Array.from({ length: 24 * 4 }).map((_, i) => {
          const hour = Math.floor(i / 4);
          const minutes = (i % 4) * 15;
          const date = new Date();
          date.setHours(hour, minutes, 0, 0);
          const time = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          return (
            <option key={time} value={time}>
              {formatTimeWithZone(date, "h:mm a", venue)}
            </option>
          );
        })}
      </select>
    );
  },
);

TimeSelect.displayName = "TimeSelect";

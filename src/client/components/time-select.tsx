import { format } from 'date-fns';
import { forwardRef } from 'react';

interface TimeSelectProps {
  value: Date;
  onChange: (hour: number, minute: number) => void;
}

export const TimeSelect = forwardRef<HTMLSelectElement, TimeSelectProps>(
  ({ value, onChange }, ref) => {
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
          const time = `${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          return (
            <option key={time} value={time}>
              {format(new Date().setHours(hour, minutes), "h:mm a")}
            </option>
          );
        })}
      </select>
    );
  }
);

TimeSelect.displayName = 'TimeSelect';

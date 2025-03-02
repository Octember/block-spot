import { startOfWeek, addDays, getDate, isToday, isSameDay } from "date-fns";
import { FC, useMemo } from "react";
import { cn } from "../../../client/cn";
import { useVenueContext } from "../providers/venue-provider";
import { Button } from "@headlessui/react";
import { DateSelectButtonMobile } from "./date-select-button";

export function getWeekDays(date: Date): { day: number; date: Date }[] {
  // Find the Saturday of the current week (weekStartsOn: 6 means Saturday)
  const weekStart = startOfWeek(date, { weekStartsOn: 6 });

  // Create an array for the 7 days, extracting the day-of-month from each date
  const days: { day: number; date: Date }[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(weekStart, i);
    days.push({ day: getDate(dayDate), date: dayDate });
  }

  return days;
}

export const DayOfWeekIndicators: FC = () => {
  return (
    <div className="flex md:hidden flex-row items-center justify-between select-none px-2 mt-2 text-center text-md">
      <span className="w-10 p-2">Sat</span>
      <span className="w-10 p-2">Sun</span>
      <span className="w-10 p-2">Mon</span>
      <span className="w-10 p-2">Tue</span>
      <span className="w-10 p-2">Wed</span>
      <span className="w-10 p-2">Thu</span>
      <span className="w-10 p-2">Fri</span>

      {/* needed for spacing */}
      <span className="w-10 p-2"></span>
    </div>
  );
};

export const DayButtons: FC = () => {
  const { selectedDate, setSelectedDate } = useVenueContext();
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  return (
    <div className="flex md:hidden flex-row items-center justify-between px-2 text-center text-lg leading-none py-2 bg-white border-b border-gray-200">
      {weekDays.map((day) => (
        <Button
          as="span"
          key={day.day}
          className={cn(
            "size-10 leading-none justify-center flex flex-col rounded-full  text-center border border-transparent",
            isSameDay(day.date, selectedDate) &&
              "bg-teal-700 text-white font-semibold",
            isToday(day.date) && "border border-cyan-700",
          )}
          onClick={() => setSelectedDate(day.date)}
        >
          {day.day}
        </Button>
      ))}
      <DateSelectButtonMobile />
    </div>
  );
};

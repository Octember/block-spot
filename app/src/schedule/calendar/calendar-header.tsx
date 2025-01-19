import { FC, useEffect, useMemo, useState } from "react";
import { cn } from "../../client/cn";
import { ButtonGroup } from "../../client/components/button-group";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import { WeekViewCalendarProps } from "./WeekViewCalendar";
import { useLocation, useSearchParams } from "react-router-dom";
import { addDays, format, isValid, parseISO, startOfToday } from "date-fns";
import { useSelectedDate } from "./providers/date-provider";

export const CalendarHeader: FC<{ venue: WeekViewCalendarProps["venue"] }> = ({
  venue,
}) => {
  const { selectedDate, setSelectedDate } = useSelectedDate();

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-50 bg-gray-100 dark:bg-boxdark-2 sticky flex flex-col",
      )}
    >
      <div className="flex px-4 py-2 gap-2 items-center">
        <ButtonGroup
          items={[
            { label: "Years", onClick: () => { } },
            { label: "Months", onClick: () => { } },
          ]}
        />

        <ButtonGroup
          items={[
            {
              label: <ChevronLeftIcon className="size-5" />,
              onClick: () => setSelectedDate(addDays(selectedDate, -1)),
            },
            {
              label: <ChevronRightIcon className="size-5" />,
              onClick: () => setSelectedDate(addDays(selectedDate, 1)),
            },
          ]}
        />

        <div className="px-2 font-bold">
          {format(selectedDate, "MMMM d, yyyy")}
        </div>
      </div>

      <div className="z-30 flex-none bg-white shadow sm:pr-8">
        <div
          className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
          style={{
            gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="col-end-1 w-14" />
          {venue.spaces.map((space, index) => (
            <div
              key={space.id}
              className="flex items-center justify-center py-2"
            >
              <span className="flex items-baseline font-medium text-gray-900">
                {space.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

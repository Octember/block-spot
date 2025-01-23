import { FC, useEffect, useMemo, useState } from "react";
import { cn } from "../../client/cn";
import { ButtonGroup } from "../../client/components/button-group";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import { WeekViewCalendarProps } from "./WeekViewCalendar";
import { useLocation, useSearchParams } from "react-router-dom";
import { addDays, format, isValid, parseISO, startOfToday } from "date-fns";
import { useSelectedDate } from "./providers/date-provider";
import { getGridTemplateColumns } from "./reservations/constants";

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
            { label: "Days", onClick: () => { } },
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
    </header>
  );
};

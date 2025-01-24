import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { addDays, format } from "date-fns";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";

import { cn } from "../../client/cn";
import { Button } from "../../client/components/button";
import { ButtonGroup } from "../../client/components/button-group";
import { isUserOwner } from '../../client/hooks/permissions';
import { useSelectedDate } from "./providers/date-provider";

export const CalendarHeader: FC = () => {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const navigate = useNavigate();

  const isOwner = isUserOwner();

  return (
    <header
      className={cn(
        "inset-x-0 top-0 z-50 bg-gray-100 dark:bg-boxdark-2 sticky flex flex-col",
      )}
    >
      <div className="flex px-4 py-2 gap-2 items-center">
        {isOwner && (
          <Button
            icon={<ArrowLeftIcon className="size-5 my-[3px]" />}
            ariaLabel="Calendar"
            variant="secondary"
            onClick={() => navigate(routes.AllVenuesPageRoute.build({}))}
          >
            Back to Dashboard
          </Button>
        )}

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

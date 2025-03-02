import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { addDays } from "date-fns";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";
import { Button } from "../../../client/components/button";
import { ButtonGroup } from "../../../client/components/button-group";
import { isUserOwner } from "../../../client/hooks/permissions";
import { useVenueContext } from "../providers/venue-provider";
import { DateSelectButton } from "./date-select-button";
import { DayOfWeekIndicators } from "./days-of-week";
import { MobileHeader, MobileMenu } from "./mobile";
import { ScrollToSpaceButtons } from "./scroll/scroll-to-space-buttons";


export const CalendarHeader: FC = () => {
  const { selectedDate, setSelectedDate } = useVenueContext();

  return (
    <header className="inset-x-0 top-0 z-50 bg-white dark:bg-boxdark-2 relative md:sticky flex flex-col min-w-full max-w-full">
      <div className="flex flex-row justify-between items-center bg-cyan-800/60">
        <div className="flex flex-1 px-4 py-2 gap-2 items-center">
          <div className="hidden md:block">
            <BackToDashboardButton />
          </div>

          <div className="hidden sm:block">
            <ButtonGroup
              items={[
                {
                  label: <ChevronLeftIcon className="size-4" />,
                  onClick: () => setSelectedDate(addDays(selectedDate, -1)),
                },
                {
                  label: <ChevronRightIcon className="size-4" />,
                  onClick: () => setSelectedDate(addDays(selectedDate, 1)),
                },
              ]}
            />
          </div>

          <div className="hidden md:block">
            <DateSelectButton />
          </div>
          <div className="flex flex-1 flex-row items-center gap-2 justify-between md:hidden">
            <MobileHeader />
            <MobileMenu />
          </div>
        </div>

        <div className="hidden md:flex flex-row items-center ">
          <ScrollToSpaceButtons />
        </div>
      </div>

      <DayOfWeekIndicators />
    </header>
  );
};

const BackToDashboardButton: FC = () => {
  const navigate = useNavigate();
  const isOwner = isUserOwner();

  if (isOwner) {
    return (
      <Button
        icon={<ArrowLeftIcon className="size-4 my-[3px]" />}
        ariaLabel="Back to Dashboard"
        variant="secondary"
        onClick={() => navigate(routes.AllVenuesPageRoute.build({}))}
      >
        Back to Dashboard
      </Button>
    );
  } else {
    return (
      <Button
        icon={<ArrowLeftIcon className="size-5 my-[3px]" />}
        ariaLabel="Back to Home"
        variant="secondary"
        onClick={() => navigate(routes.LandingPageRoute.to)}
      >
        Back to Home
      </Button>
    );
  }
};

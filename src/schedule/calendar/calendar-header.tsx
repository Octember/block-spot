import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";

import { cn } from "../../client/cn";
import { Button } from "../../client/components/button";
import { ButtonGroup } from "../../client/components/button-group";
import { isUserOwner } from "../../client/hooks/permissions";
import { useVenueContext } from "./providers/venue-provider";
import {
  getUserTimeZoneAbbreviation,
  useIsTimeZoneDifferent,
  useVenueTimeZoneAbbreviation,
} from "./constants";
import { getGridTemplateColumns } from "./reservations/constants";
import { ScrollToSpaceButtons } from './scroll/scroll-to-space-buttons';


export const CalendarHeader: FC = () => {
  const { selectedDate, setSelectedDate, venue } = useVenueContext();
  const navigate = useNavigate();
  const isOwner = isUserOwner();

  return (
    <header
      className={cn(
        "inset-x-0 top-0 left-0 right-0 z-50 bg-white dark:bg-boxdark-2 sticky flex flex-col min-w-max w-full ",
      )}
    >
      <div className="flex flex-row justify-between items-center bg-cyan-800/40">
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
            {formatInTimeZone(selectedDate, venue.timeZoneId, "MMMM d, yyyy")}
          </div>
        </div>


        <ScrollToSpaceButtons />
      </div>
    </header>
  );
};

export const SpacesNamesSection: FC = () => {
  const { venue } = useVenueContext();
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const heightOfHeader = 56; // or whatever your CalendarHeader height is

  const scrollClass = isTimeZoneDifferent ? "scroll-ml-24" : "scroll-ml-14";

  return (
    <div
      className={`sticky top-[${heightOfHeader}px] z-40 bg-white min-w-max w-full`}
    >
      <div className="z-30 flex-none bg-white shadow-4 sm:pr-8">
        <div
          className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
          style={{
            gridTemplateColumns: getGridTemplateColumns(venue.spaces.length),
          }}
        >
          <TimeZoneLabel />
          {venue.spaces.map((space, index) => (
            <div
              id={`space-${index}`}
              key={space.id}
              className={`flex items-center justify-center py-2 snap-start ${scrollClass}`}
            >
              <span className="flex items-baseline text-md font-semibold py-1 text-gray-900">
                {space.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const TimeZoneLabel: FC = () => {
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const widthClass = isTimeZoneDifferent ? "w-24" : "w-14";
  const venueTimeZoneAbbreviation = useVenueTimeZoneAbbreviation();


  return (
    <div className={`col-end-1 ${widthClass} flex flex-col`}>
      <div
        className={`flex-1 flex items-center ${isTimeZoneDifferent ? "justify-between" : "justify-center"} p-2`}
      >
        {isTimeZoneDifferent && (
          <>
            <span className="text-xs text-gray-500">
              {getUserTimeZoneAbbreviation()}
            </span>
            <span className="text-xs text-gray-700 font-bold">
              {venueTimeZoneAbbreviation}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

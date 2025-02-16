import { FC } from "react";
import { useVenueContext } from "../providers/venue-provider";
import {
  getUserTimeZoneAbbreviation,
  useIsTimeZoneDifferent,
  useVenueTimeZoneAbbreviation,
} from "../constants";
import { getGridTemplateColumns } from "../reservations/constants";

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
              tabIndex={0}
              className={`flex items-center justify-center py-2 snap-start ${scrollClass} focus:bg-gray-300`}
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

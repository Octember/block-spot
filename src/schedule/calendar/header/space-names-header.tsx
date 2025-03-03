import { FC } from "react";
import { useVenueContext } from "../providers/venue-provider";
import {
  getUserTimeZoneAbbreviation,
  useIsTimeZoneDifferent,
  useVenueTimeZoneAbbreviation,
} from "../constants";
import { getGridTemplateColumns } from "../reservations/constants";
import { LuSearch } from "react-icons/lu";
import { useHorizontalScroll } from "../providers/scroll/horizontal-scroll-provider";
import { Button } from "@headlessui/react";

export const SpacesNamesSection: FC = () => {
  const { scrolledPixels } = useHorizontalScroll();
  const { venue } = useVenueContext();
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const scrollClass = isTimeZoneDifferent ? "scroll-ml-24" : "scroll-ml-14";

  return (
    <div className="z-30 bg-white w-screen shadow-4 flex flex-row overflow-hidden">
      <div className="w-14">
        <Button as="div" className="flex h-full items-center justify-center">
          <LuSearch className="size-6" />
        </Button>
      </div>

      <div className="z-30 flex-1 bg-white sm:pr-8 overflow-hidden">
        <div
          className="relative grid grid-flow-col divide-x divide-gray-100 border-gray-100 text-sm/6 text-gray-500"
          style={{
            gridTemplateColumns: getGridTemplateColumns(venue.spaces.length),
            gridTemplateRows: "1fr",
            left: `-${scrolledPixels}px`,
          }}
        >
          {venue.spaces.map((space, index) => (
            <div
              key={space.id}
              tabIndex={0}
              className={`flex items-center justify-center py-2 ${scrollClass}`}
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

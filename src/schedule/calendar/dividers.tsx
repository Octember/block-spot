import { Fragment, FC } from "react";
import {
  useIsTimeZoneDifferent,
  useTimeLabels,
  useTimeLabelsAndZones,
} from "./constants";
import {
  MinutesPerSlot,
  PixelsPerSlot,
  getGridTemplateColumns,
} from "./reservations/constants";
import { useVenueContext } from "./providers/venue-provider";

export const HorizontalDividers: FC = () => {
  const timeLabels = useTimeLabelsAndZones();
  const isTimeZoneDifferent = useIsTimeZoneDifferent();
  const labelWidthClass = isTimeZoneDifferent ? "-ml-24 w-24" : "-ml-14 w-14";

  return (
    <div
      className="col-start-1 col-end-2 row-start-1 grid"
      style={{
        gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
      }}
    >
      <div className="border-b border-gray-400" />

      {timeLabels.map((label, index) => (
        <Fragment key={index}>
          {/* 15min line and label */}
          {/* 30, 45, 60min line */}
          {Array.from({ length: 60 / MinutesPerSlot }).map((_, index) => (
            <div
              key={index}
              className={`row-span-1 border-b ${getBorderStyle(index)}`}
            ></div>
          ))}
        </Fragment>
      ))}
    </div>
  );
};

function getBorderStyle(index: number) {
  if (index === 0 || index === 2) return "border-b border-gray-100";
  if (index === 1) return "border-b border-gray-200";
  if (index === 3) return "border-b border-gray-300";
}

export const VerticalDividers: FC = () => {
  const { venue } = useVenueContext();

  return (
    <div
      className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-300 grid"
      style={{
        gridTemplateColumns: getGridTemplateColumns(venue.spaces.length),
      }}
    >
      {Array.from({ length: venue.spaces.length + 1 }).map((_, index) => (
        // snap-start drives the scroll snap to space column
        <div
          id={`space-${index}`}
          key={index}
          className={`snap-start col-start-${index + 1} row-span-full`}
        />
      ))}
    </div>
  );
};

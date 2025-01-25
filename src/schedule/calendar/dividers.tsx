import { Fragment, FC } from "react";
import { useTimeLabels } from "./constants";
import {
  MinutesPerSlot,
  PixelsPerSlot,
  getGridTemplateColumns,
} from "./reservations/constants";
import { useScheduleContext } from "./providers/schedule-query-provider";

export const HorizontalDividers: FC = () => {
  const timeLabels = useTimeLabels();
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
          <div className={`row-span-1 border-b ${getBorderStyle(0)}`}>
            <div className="sticky left-0 z-99 -ml-14 w-14 pr-2 -my-2.5 text-right text-xs/5 text-gray-500 select-none">
              {label}
            </div>
          </div>
          {/* 30, 45, 60min line */}
          {Array.from({ length: 60 / MinutesPerSlot - 1 }).map((_, index) => (
            <div
              key={index}
              className={`row-span-1 border-b ${getBorderStyle(index + 1)}`}
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
  const { venue } = useScheduleContext();

  return (
    <div
      className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-300 grid sm:pr-8"
      style={{
        gridTemplateColumns: getGridTemplateColumns(venue.spaces.length),
      }}
    >
      {Array.from({ length: venue.spaces.length + 1 }).map((_, index) => (
        <div key={index} className={`col-start-${index + 1} row-span-full}`} />
      ))}
    </div>
  );
};

import React from 'react';
import { FC } from 'react';
import { useTimeLabels } from './constants';
import { MinutesPerSlot, PixelsPerSlot } from './reservations/constants';
import { useScheduleContext } from './providers/schedule-query-provider';


export const HorizontalDividers: FC = () => {
  const timeLabels = useTimeLabels();
  return <div
    className="col-start-1 col-end-2 row-start-1 grid"
    style={{
      gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
    }}
  >
    <div
      className="border-b border-gray-400"
    />

    {timeLabels.map((label, index) => (
      <React.Fragment key={index}>
        {/* 15min line and label */}
        <div className={`row-span-1 border-b ${getBorderStyle(0)}`}>
          <div className="sticky left-0 z-20 -ml-14 w-14 pr-2 -my-2.5 text-right text-xs/5 text-gray-500">
            {label}
          </div>
        </div>
        {/* 30, 45, 60min line */}
        {Array.from({ length: 60 / MinutesPerSlot - 1 }).map(
          (_, index) => (
            <div
              key={index}
              className={`row-span-1 border-b ${getBorderStyle(index + 1)}`}
            ></div>
          ),
        )}
      </React.Fragment>
    ))}
  </div>
}

function getBorderStyle(index: number) {
  if (index === 0 || index === 2) return "border-b border-gray-100";
  if (index === 1) return "border-b border-gray-200";
  if (index === 3) return "border-b border-gray-300";
}

export const VerticalDividers: FC = () => {
  const { venue } = useScheduleContext();

  return <div
    className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-300 grid sm:pr-8"
    style={{
      gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
    }}
  >
    {Array.from({ length: venue.spaces.length + 1 }).map(
      (_, index) => (
        <div
          key={index}
          className={`col-start-${index + 1} row-span-full}`}
        />
      ),
    )}
  </div>
}
import { FC, Fragment } from "react";
import { useIsTimeZoneDifferent, useTimeLabelsAndZones } from "../constants";
import { MinutesPerSlot, PixelsPerSlot } from "../reservations/constants";

export const TimeLabels: FC = () => {
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
      <div className="" />

      {timeLabels.map((label, index) => (
        <Fragment key={index}>
          {/* 15min line and label */}
          <div className={`row-span-4`}>
            <div
              className={`sticky left-0 z-40 ${labelWidthClass} pr-2 -my-2.5 text-right text-xs/5 text-gray-500 select-none`}
            >
              {label}
            </div>
          </div>
        </Fragment>
      ))}
    </div>
  );
};

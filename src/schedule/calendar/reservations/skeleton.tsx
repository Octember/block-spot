import { FC } from "react";
import { useTimeLabels } from "../constants";
import { getSharedGridStyle } from "./constants";
import { useVenueContext } from "../providers/venue-provider";

const SkeletonReservation = ({
  startRow,
  rowSpan,
  columnIndex,
}: {
  startRow: number;
  rowSpan: number;
  columnIndex: number;
}) => {
  return (
    <div
      className="relative animate-pulse bg-gray-200 rounded-lg mx-2 my-1"
      style={{
        gridRow: `${startRow} / span ${rowSpan}`,
        gridColumnStart: columnIndex + 1,
      }}
    >
      <div className="h-full w-full flex flex-col p-2">
        <div className="h-3 w-3/4 bg-gray-300 rounded mb-1"></div>
        <div className="h-2 w-1/2 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export const SkeletonReservationsSection: FC = () => {
  const timeLabels = useTimeLabels();
  const { venue } = useVenueContext();

  // Generate some random skeleton placements
  const skeletons: {
    startRow: number;
    rowSpan: number;
    columnIndex: number;
  }[] = [];
  const numSpaces = venue.spaces.length;

  // Create 2-3 skeletons per space
  for (let spaceIndex = 0; spaceIndex < numSpaces; spaceIndex++) {
    // Morning reservation (around 9-10am)
    skeletons.push({
      startRow: 15 + Math.floor(Math.random() * 10), // Approximately 9am (adjust based on your grid)
      rowSpan: 4, // 1 hour (4 x 15 min slots)
      columnIndex: spaceIndex,
    });

    // Afternoon reservation (around 2-3pm)
    if (Math.random() > 0.5) {
      skeletons.push({
        startRow: 20 + Math.floor(Math.random() * 10), // Approximately 2pm
        rowSpan: 6, // 1.5 hours
        columnIndex: spaceIndex,
      });
    }

    // Add a random third reservation for some spaces
    if (Math.random() > 0.5) {
      skeletons.push({
        startRow: 44 + Math.floor(Math.random() * 8), // Random midday time
        rowSpan: 2 + Math.floor(Math.random() * 4), // Random duration
        columnIndex: spaceIndex,
      });
    }
  }

  return (
    <div {...getSharedGridStyle(timeLabels.length, numSpaces)}>
      {skeletons.map((skeleton, index) => (
        <SkeletonReservation
          key={index}
          startRow={skeleton.startRow}
          rowSpan={skeleton.rowSpan}
          columnIndex={skeleton.columnIndex}
        />
      ))}
    </div>
  );
};

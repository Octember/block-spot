import { getSharedGridStyle, MinutesPerSlot, PixelsPerSlot } from "./constants";
import { DroppableSpace } from "./droppable";
import { getRowSpan, isWithinReservation, getRowIndex } from "./utilities";
import { Reservation, Venue } from "wasp/entities";
import { addMinutes } from "date-fns";

interface DraggingGridProps {
  draggingReservation: Reservation;
  timeLabels: string[];
  spaceIds: string[];
  reservations: Reservation[];
  venue: Venue;
  transform: { x: number; y: number } | null;
}

export const DraggingGrid: React.FC<DraggingGridProps> = ({
  draggingReservation,
  timeLabels,
  spaceIds,
  reservations,
  venue,
  transform,
}) => {
  const rowSpan = getRowSpan(draggingReservation);

  // Calculate the adjusted start time based on drag position
  const adjustedStartTime = transform
    ? addMinutes(
        draggingReservation.startTime,
        (Math.round((transform.y / PixelsPerSlot) * MinutesPerSlot) /
          MinutesPerSlot) *
          MinutesPerSlot,
      )
    : draggingReservation.startTime;

  const rowIndex = getRowIndex(venue, adjustedStartTime);

  return (
    <ol {...getSharedGridStyle(timeLabels.length, spaceIds.length)}>
      {spaceIds.map((spaceId, columnIndex) => {
        // Check if this space is occupied for the dragging reservation
        const isOccupied = reservations.some(
          (reservation) =>
            reservation.id !== draggingReservation.id &&
            reservation.spaceId === spaceId &&
            // TODO: Not sure why -1 is needed here
            isWithinReservation(venue, rowIndex - 1, rowSpan, reservation),
        );

        // Only render one droppable space per column
        return (
          <DroppableSpace
            key={`${spaceId}-drop`}
            spaceId={spaceId}
            columnIndex={columnIndex}
            rowIndex={rowIndex}
            rowSpan={rowSpan}
            occupied={isOccupied}
          />
        );
      })}
    </ol>
  );
};

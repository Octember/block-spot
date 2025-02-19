import { getSharedGridStyle, MinutesPerSlot } from './constants';
import { DroppableSpace } from './droppable';
import { getRowSpan, isWithinReservation } from './utilities';
import { Reservation, Venue } from 'wasp/entities';
interface DraggingGridProps {
  draggingReservation: Reservation;
  timeLabels: string[];
  spaceIds: string[];
  reservations: Reservation[];
  venue: Venue;
}

export const DraggingGrid: React.FC<DraggingGridProps> = ({
  draggingReservation,
  timeLabels,
  spaceIds,
  reservations,
  venue,
}) => {
  return (
    <ol {...getSharedGridStyle(timeLabels.length, spaceIds.length)}>
      {spaceIds.map((spaceId, columnIndex) =>
        Array.from({
          length: timeLabels.length * (60 / MinutesPerSlot),
        }).map((_, rowIndex) => {
          if (rowIndex === 0) return null;

          return (
            <DroppableSpace
              key={`${spaceId}-${rowIndex}`}
              spaceId={spaceId}
              columnIndex={columnIndex}
              rowIndex={rowIndex}
              rowSpan={getRowSpan(draggingReservation)}
              occupied={reservations.some(
                (reservation) =>
                  reservation.id !== draggingReservation.id &&
                  reservation.spaceId === spaceId &&
                  isWithinReservation(
                    venue,
                    rowIndex,
                    getRowSpan(draggingReservation),
                    reservation,
                  ),
              )}
            />
          );
        }),
      )}
    </ol>
  );
};

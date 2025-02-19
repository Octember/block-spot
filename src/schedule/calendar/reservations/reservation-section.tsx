import { DndContext, MouseSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { isSameDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTimeLabels } from "../constants";
import { UTCToLocal } from "../date-utils";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useScheduleContext } from "../providers/schedule-context-provider";
import { useVenueContext } from "../providers/venue-provider";
import { getSharedGridStyle, MinutesPerSlot } from "./constants";
import { DroppableSpace } from "./droppable";
import { ReservationSlot } from "./reservation-slot";
import {
  getRowSpan,
  isWithinReservation,
  setTimesOnDate,
  useGetTimeFromRowIndex,
} from "./utilities";
import { Reservation, User, Venue } from "wasp/entities";

interface DraggingGridProps {
  draggingReservation: Reservation;
  timeLabels: string[];
  spaceIds: string[];
  reservations: Reservation[];
  venue: Venue;
}

const DraggingGrid: React.FC<DraggingGridProps> = ({
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

export const ReservationsSection = () => {
  const { venue } = useVenueContext();
  const { spaces } = useScheduleContext();
  const timeLabels = useTimeLabels();
  const { pendingChange, setPendingChange } = usePendingChanges();
  const getTimeFromRowIndex = useGetTimeFromRowIndex();
  const [draggingReservationId, setDraggingReservationId] = useState<
    string | null
  >(null);

  const [reservations, setReservations] = useState<
    (Reservation)[]
  >(spaces.flatMap((space) => space.reservations));

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const sensors = useSensors(mouseSensor);

  useEffect(() => {
    setReservations(spaces.flatMap((space) => space.reservations));
  }, [spaces]);

  const spaceIds = spaces.map((space) => space.id);

  const draggingReservation = useMemo(() => {
    const match = reservations.find(
      (reservation) => reservation.id === draggingReservationId,
    );
    if (match) return match;
    if (pendingChange) return pendingChange.newState;
    return null;
  }, [reservations, draggingReservationId, pendingChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const reservationId = event.active.data.current?.reservationId;
    setDraggingReservationId(reservationId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingReservationId(null);

    const droppable = event.over?.data.current;

    if (!draggingReservation) return;
    if (!droppable) return;

    // Get raw times from row indices and set them to the same day as dragging reservation
    const rawStartTime = getTimeFromRowIndex(droppable.rowIndex + 1);
    const rawEndTime = getTimeFromRowIndex(
      droppable.rowIndex + droppable?.rowSpan + 1,
    );
    const { startTime, endTime } = setTimesOnDate(
      rawStartTime,
      rawEndTime,
      draggingReservation.startTime,
      venue,
    );

    const newSpaceId = droppable.spaceId;

    const isCollision = reservations.some((reservation) => {
      if (reservation.id === draggingReservation.id) return false;
      if (
        reservation.spaceId === newSpaceId &&
        reservation.startTime < endTime &&
        reservation.endTime > startTime
      ) {
        return true;
      }
      return false;
    });
    if (isCollision) return;

    if (draggingReservation.id === "draft") {
      setPendingChange({
        type: "CREATE",
        newState: {
          ...draggingReservation,
          startTime,
          endTime,
          spaceId: newSpaceId,
        },
      });
    } else {
      const updatedReservation = {
        ...draggingReservation,
        startTime,
        endTime,
        spaceId: newSpaceId,
      };

      // Update local state for immediate feedback
      setReservations([
        ...reservations.filter((r) => r.id !== draggingReservation.id),
        updatedReservation,
      ]);

      // Create pending change
      setPendingChange({
        type: "UPDATE",
        oldState: draggingReservation,
        newState: updatedReservation,
      });
    }
    setDraggingReservationId(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    // Implement drag move logic if needed
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
    >
      {draggingReservation && (
        <DraggingGrid
          draggingReservation={draggingReservation}
          timeLabels={timeLabels}
          spaceIds={spaceIds}
          reservations={reservations}
          venue={venue}
        />
      )}

      <ol {...getSharedGridStyle(timeLabels.length, spaceIds.length)}>
        {reservations
          .filter(
            (reservation) =>
              !pendingChange || pendingChange.oldState?.id !== reservation.id,
          )
          .map((reservation) => (
            <ReservationSlot
              key={reservation.id}
              reservation={reservation}
              isDraft={false}
              gridIndex={spaceIds.findIndex(
                (spaceId) => spaceId === reservation.spaceId,
              )}
              onDelete={async () => {
                setPendingChange({
                  type: "DELETE",
                  oldState: reservation,
                  newState: reservation,
                });
              }}
            />
          ))}
        <PendingChangeSlot />
      </ol>
    </DndContext>
  );
};

const PendingChangeSlot = () => {
  const { spaces } = useScheduleContext();
  const { venue, selectedDate } = useVenueContext();
  const spaceIds = spaces.map((space) => space.id);

  const { pendingChange } = usePendingChanges();

  if (!pendingChange) return null;

  const pendingDate = UTCToLocal(pendingChange.newState.startTime, venue);
  const selectedLocalDate = UTCToLocal(selectedDate, venue);
  if (!isSameDay(pendingDate, selectedLocalDate)) return null;

  return (
    <ReservationSlot
      reservation={pendingChange.newState}
      gridIndex={spaceIds.findIndex(
        (spaceId) => spaceId === pendingChange.newState.spaceId,
      )}
      isDraft
    />
  );
};

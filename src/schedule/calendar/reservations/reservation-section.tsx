import { DndContext, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { isSameDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTimeLabels } from "../constants";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useScheduleContext } from "../providers/schedule-context-provider";
import { getSharedGridStyle, MinutesPerSlot } from "./constants";
import { DroppableSpace } from "./droppable";
import { ReservationSlot } from "./reservation-slot";
import { UTCToLocal } from "../date-utils";
import {
  getRowSpan,
  getTimeFromRowIndex,
  isWithinReservation,
  setTimesOnDate,
} from "./utilities";
import { useVenueContext } from "../providers/venue-provider";

export const ReservationsSection = () => {
  const { selectedDate } = useVenueContext()
  const { venue } = useScheduleContext();
  const timeLabels = useTimeLabels();
  const { pendingChange, setPendingChange } = usePendingChanges();

  const [draggingReservationId, setDraggingReservationId] = useState<
    string | null
  >(null);

  const [reservations, setReservations] = useState(
    venue.spaces.flatMap((space) => space.reservations),
  );

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const sensors = useSensors(mouseSensor);

  useEffect(() => {
    setReservations(venue.spaces.flatMap((space) => space.reservations));
  }, [venue]);

  const spaceIds = venue.spaces.map((space) => space.id);

  const draggingReservation = useMemo(() => {
    const match = reservations.find(
      (reservation) => reservation.id === draggingReservationId,
    );
    if (match) return match;
    if (pendingChange) return pendingChange.newState;
    return null;
  }, [reservations, draggingReservationId, pendingChange]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const reservationId = event.active.data.current?.reservationId;
        setDraggingReservationId(reservationId);
      }}
      onDragEnd={async (e) => {
        setDraggingReservationId(null);

        const droppable = e.over?.data.current;

        if (!draggingReservation) return;
        if (!droppable) return;

        // Get raw times from row indices and set them to the same day as dragging reservation
        const rawStartTime = getTimeFromRowIndex(venue, droppable.rowIndex + 1);
        const rawEndTime = getTimeFromRowIndex(
          venue,
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
      }}
    >
      {/* Droppable spaces */}
      {draggingReservation && (
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
        {pendingChange && (() => {
          // Convert both dates to venue's timezone before comparing
          const pendingDate = UTCToLocal(pendingChange.newState.startTime, venue);
          const selectedLocalDate = UTCToLocal(selectedDate, venue);

          console.log({ startTime: pendingChange.newState.startTime, pendingDate, selectedLocalDate });
          return isSameDay(pendingDate, selectedLocalDate);
        })() && (
            <ReservationSlot
              reservation={pendingChange.newState}
              gridIndex={spaceIds.findIndex(
                (spaceId) => spaceId === pendingChange.newState.spaceId,
              )}
              isDraft
            />
          )}
      </ol>
    </DndContext>
  );
};

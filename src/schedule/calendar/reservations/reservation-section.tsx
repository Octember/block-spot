import { DndContext, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { addMinutes } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../client/toast";
import { useTimeLabels } from "../constants";
import { useDraftReservation } from "../providers/draft-reservation-provider";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { useScheduleContext } from "../providers/schedule-query-provider";
import { getSharedGridStyle, MinutesPerSlot, PixelsPerSlot } from "./constants";
import { DroppableSpace } from "./droppable";
import { ReservationSlot } from "./reservation-slot";
import { getRowSpan, isWithinReservation } from "./utilities";

export const ReservationsSection = () => {
  const setToast = useToast();
  const { venue } = useScheduleContext();
  const { refresh } = useScheduleContext();
  const timeLabels = useTimeLabels();
  const { setPendingChange } = usePendingChanges();

  const { draftReservation, setDraftReservation } = useDraftReservation();

  const [draggingReservationId, setDraggingReservationId] = useState<string | null>(null);
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
    if (draftReservation) return draftReservation;
    return null;
  }, [reservations, draggingReservationId, draftReservation]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const reservationId = event.active.data.current?.reservationId;
        setDraggingReservationId(reservationId);
      }}
      onDragEnd={async (e) => {
        const delta = Math.round(e.delta.y / PixelsPerSlot);
        const newSpaceId =
          e.over?.data.current?.spaceId || draftReservation?.spaceId;

        if (!draggingReservation) return;

        const draftStartTime = addMinutes(
          draggingReservation.startTime,
          delta * MinutesPerSlot,
        );
        const draftEndTime = addMinutes(
          draggingReservation.endTime,
          delta * MinutesPerSlot,
        );
        const isCollision = reservations.some((reservation) => {
          if (reservation.id === draggingReservation.id) return false;
          if (
            reservation.spaceId === newSpaceId &&
            reservation.startTime < draftEndTime &&
            reservation.endTime > draftStartTime
          ) {
            return true;
          }
          return false;
        });
        if (isCollision) return;

        if (draggingReservation.id === "draft") {
          setDraftReservation({
            ...draggingReservation,
            startTime: addMinutes(
              draggingReservation.startTime,
              delta * MinutesPerSlot,
            ),
            endTime: addMinutes(
              draggingReservation.endTime,
              delta * MinutesPerSlot,
            ),
            spaceId: newSpaceId,
          });
        } else {
          const updatedReservation = {
            ...draggingReservation,
            startTime: addMinutes(
              draggingReservation.startTime,
              delta * MinutesPerSlot,
            ),
            endTime: addMinutes(
              draggingReservation.endTime,
              delta * MinutesPerSlot,
            ),
            spaceId: newSpaceId,
          };

          // Update local state for immediate feedback
          setReservations([
            ...reservations.filter((r) => r.id !== draggingReservation.id),
            updatedReservation,
          ]);

          // Create pending change
          setPendingChange({
            type: 'UPDATE',
            oldState: draggingReservation,
            newState: updatedReservation,
          });
        }
      }}
    >
      {/* Droppable spaces */}
      {draggingReservation && (
        <ol {...getSharedGridStyle(timeLabels.length, spaceIds.length)}>
          {spaceIds.map((spaceId, columnIndex) =>
            Array.from({
              length: timeLabels.length * (60 / MinutesPerSlot),
            }).map((_, rowIndex) => (
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
            )),
          )}
        </ol>
      )}

      <ol {...getSharedGridStyle(timeLabels.length, spaceIds.length)}>
        {reservations.map((reservation) => (
          <ReservationSlot
            key={reservation.id}
            reservation={reservation}
            isDraft={false}
            gridIndex={spaceIds.findIndex(
              (spaceId) => spaceId === reservation.spaceId,
            )}
            onDelete={async () => {
              setPendingChange({
                type: 'DELETE',
                oldState: reservation,
                newState: reservation,
              });
            }}
          />
        ))}
        {draftReservation && (
          <ReservationSlot
            reservation={draftReservation}
            gridIndex={spaceIds.findIndex(
              (spaceId) => spaceId === draftReservation.spaceId,
            )}
            isDraft
            onCreate={async () => {
              setPendingChange({
                type: 'CREATE',
                newState: draftReservation,
              });
              setDraftReservation(null);
            }}
            onDiscardDraft={() => setDraftReservation(null)}
          />
        )}
      </ol>
    </DndContext>
  );
};

import { DndContext, MouseSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { addMinutes } from 'date-fns';
import { useMemo, useState } from 'react';
import { deleteReservation, getVenueInfo, updateReservation, useQuery } from 'wasp/client/operations';
import { Reservation } from 'wasp/entities';
import { useToast } from '../../../client/toast';
import { WeekViewCalendarProps } from '../WeekViewCalendar';
import { timeLabels } from '../constants';
import { GridSelection } from '../selection';
import { ReservationSlot } from './reservation-slot';
import { getRowSpan } from './utilities';

const GridSize = 32;

export const ReservationsSection = ({ venue, spaceIds }: WeekViewCalendarProps & { spaceIds: string[] }) => {

  const setToast = useToast();

  const [reservations, setReservations] = useState(venue.spaces.flatMap((space) => space.reservations));
  const { refetch } = useQuery(getVenueInfo);

  const [draftReservation, setDraftReservation] = useState<Reservation | null>(
    null
  );
  const [draggingReservationId, setDraggingReservationId] = useState<string | null>(null);

  const draggingReservation = useMemo(() => {
    const match = reservations.find((reservation) => reservation.id === draggingReservationId)
    if (match) return match;
    if (draftReservation) return draftReservation;
    return null;
  }, [reservations, draggingReservationId, draftReservation])


  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // needed to allow clicking on the reservation slot
    },
  })
  const sensors = useSensors(mouseSensor)

  return <>
    <DndContext sensors={sensors}
      onDragStart={(event) => {
        const reservationId = event.active.data.current?.reservationId;
        setDraggingReservationId(reservationId);
      }}
      // collisionDetection={pointerWithin}
      onDragEnd={async (e) => {
        const delta = Math.round(e.delta.y / (GridSize));
        const newSpaceId = e.over?.data.current?.spaceId || draftReservation?.spaceId;

        if (!draggingReservation) return;

        const draftStartTime = addMinutes(draggingReservation.startTime, delta * 30);
        const draftEndTime = addMinutes(draggingReservation.endTime, delta * 30);
        const isCollision = reservations.some((reservation) => {

          if (reservation.id === draggingReservation.id) return false;
          // Check if there's an overlap between the draftReservation and an existing reservation
          if (reservation.spaceId === newSpaceId && reservation.startTime < draftEndTime && reservation.endTime > draftStartTime) {
            return true;
          }
          return false;
        });
        if (isCollision) return;

        if (draggingReservation.id === 'draft') {
          setDraftReservation({
            ...draggingReservation,
            startTime: addMinutes(draggingReservation.startTime, delta * 30),
            endTime: addMinutes(draggingReservation.endTime, delta * 30),
            spaceId: newSpaceId,
          });
        } else {
          const updatedReservation = {
            ...draggingReservation,
            startTime: addMinutes(draggingReservation.startTime, delta * 30),
            endTime: addMinutes(draggingReservation.endTime, delta * 30),
            spaceId: newSpaceId,
          }
          // update in state to avoid flicker
          setReservations(reservations.map((reservation) => {
            if (reservation.id === draggingReservation.id) {
              return updatedReservation;
            }
            return reservation;
          }))

          await updateReservation({
            ...updatedReservation,
          });
          setToast({ title: "Reservation updated" });
        }
      }}
    >
      {/* Droppable spaces */}
      {draggingReservation &&
        <ol
          className="col-start-1 col-end-2 row-start-1 grid sm:pr-8"
          style={{
            gridTemplateRows: `2rem repeat(${timeLabels.length * 2}, 2rem)`,
            gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
          }}
        >
          {spaceIds.map((spaceId, columnIndex) => (
            Array.from({ length: timeLabels.length * 2 }).map((_, rowIndex) => (
              <DroppableSpace
                key={`${spaceId}-${rowIndex}`}
                spaceId={spaceId}
                columnIndex={columnIndex}
                rowIndex={rowIndex}
                rowSpan={getRowSpan(draggingReservation)}
              />
            ))
          ))}
        </ol>
      }

      <ol
        className="col-start-1 col-end-2 row-start-1 grid sm:pr-8"
        style={{
          gridTemplateRows: `2rem repeat(${timeLabels.length * 2}, 2rem)`,
          gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
        }}
      >
        {reservations.map((reservation) => (
          <ReservationSlot
            key={reservation.id}
            reservation={reservation}
            isDraft={false}
            gridIndex={spaceIds.findIndex(
              (spaceId) => spaceId === reservation.spaceId
            )}
            onDelete={async () => {
              await deleteReservation({ id: reservation.id });
              setToast({ title: "Reservation deleted" });
              refetch();
            }}
          />
        ))}
        {draftReservation && (
          <ReservationSlot
            reservation={draftReservation}
            gridIndex={spaceIds.findIndex(
              (spaceId) => spaceId === draftReservation.spaceId
            )}
            isDraft
            onCreate={async () => {
              setDraftReservation(null);
              refetch();
            }}
            onDiscardDraft={() => setDraftReservation(null)}
          />
        )}
      </ol>
    </DndContext>
    <GridSelection
      spaceCount={venue.spaces.length}
      timeLabels={timeLabels}
      onSelectionComplete={(start: Date, end: Date, spaceIndex: number) => {
        setDraftReservation({
          id: "draft",
          spaceId: spaceIds[spaceIndex],
          startTime: start,
          endTime: end,
          status: "PENDING",
          userId: "1",
          createdAt: new Date(),
          updatedAt: new Date(),
          description: "Draft reservation",
        });
      }}
    />
  </>
}

const DroppableSpace = ({ spaceId, columnIndex, rowIndex, rowSpan }: { spaceId: string; columnIndex: number; rowIndex: number; rowSpan: number }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${spaceId}-${rowIndex}`,
    data: {
      spaceId,
      rowIndex,
    },
  });

  return <li ref={setNodeRef}
    className={`${isOver ? "bg-gray-300" : ""} border`}
    style={{
      gridRow: `${rowIndex + 1} / span ${rowSpan}`,
      gridColumnStart: columnIndex + 1,
    }}
  />

}

import { addMinutes } from 'date-fns';
import { useCallback, useState } from 'react';
import { Reservation } from 'wasp/entities';
import { GridSelection } from '../selection';
import { ReservationSlot } from '../reservation-slot';
import { useQuery, getVenueInfo, deleteReservation } from 'wasp/client/operations';
import { DndContext, MouseSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useToast } from '../../../client/toast';
import { WeekViewCalendarProps } from '../WeekViewCalendar';
import { timeLabels } from '../constants';
const GridSize = 32;


export const ReservationsSection = ({ venue, spaceIds }: WeekViewCalendarProps & { spaceIds: string[] }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${venue.id}`,
  });
  const setToast = useToast();


  const reservations = venue.spaces.flatMap((space) => space.reservations);
  const { refetch } = useQuery(getVenueInfo);

  const [draftReservation, setDraftReservation] = useState<Reservation | null>(
    null
  );


  const handleSelectionComplete = useCallback(
    (start: Date, end: Date, spaceIndex: number) => {
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
    },
    [setDraftReservation]
  );

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // needed to allow clicking on the reservation slot
    },
  })
  const sensors = useSensors(mouseSensor)

  return <>
    <DndContext sensors={sensors}
      // collisionDetection={pointerWithin}
      onDragEnd={(e) => {
        const delta = Math.round(e.delta.y / (GridSize));
        const newSpaceId = e.over?.data.current?.spaceId || draftReservation?.spaceId;

        if (!draftReservation) return;

        const draftStartTime = addMinutes(draftReservation.startTime, delta * 30);
        const draftEndTime = addMinutes(draftReservation.endTime, delta * 30);
        const isCollision = reservations.some((reservation) => {
          // Check if there's an overlap between the draftReservation and an existing reservation
          if (reservation.spaceId === newSpaceId && reservation.startTime < draftEndTime && reservation.endTime > draftStartTime) {
            return true;
          }
          return false;
        });
        if (isCollision) return;

        setDraftReservation({
          ...draftReservation,
          startTime: addMinutes(draftReservation.startTime, delta * 30),
          endTime: addMinutes(draftReservation.endTime, delta * 30),
          spaceId: newSpaceId,
        });
      }}
    >
      {/* Droppable spaces */}
      <ol
        className="col-start-1 col-end-2 row-start-1 grid sm:pr-8"
        style={{
          gridTemplateRows: `2rem repeat(${timeLabels.length * 2}, 2rem)`,
          gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
        }}
      >
        {spaceIds.map((spaceId, columnIndex) => (
          Array.from({ length: timeLabels.length * 2 }).map((_, rowIndex) => (
            <DroppableSpace key={`${spaceId}-${rowIndex}`} spaceId={spaceId} columnIndex={columnIndex} rowIndex={rowIndex} />
          ))
        ))}
      </ol>

      <ol
        ref={setNodeRef}
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
      onSelectionComplete={handleSelectionComplete}
    />
  </>
}

const DroppableSpace = ({ spaceId, columnIndex, rowIndex }: { spaceId: string; columnIndex: number; rowIndex: number }) => {
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
      gridRow: `${rowIndex + 1} / span 2`,
      gridColumnStart: columnIndex + 1,
    }}
  />

}

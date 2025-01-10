import { addMinutes, format } from "date-fns";
import React, { FC, useCallback, useRef, useState } from "react";
import { Reservation, Space, Venue } from "wasp/entities";
import { GridSelection } from "./selection";
import { ReservationSlot } from "./reservation-slot";
import {
  useQuery,
  getVenueInfo,
  createReservation,
  deleteReservation,
} from "wasp/client/operations";
import { closestCorners, DndContext, MouseSensor, pointerWithin, rectIntersection, TouchSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";

import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  createSnapModifier
} from '@dnd-kit/modifiers';
import { useToast } from '../../client/toast';

const timeLabels = [
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
];

interface WeekViewCalendarProps {
  venue: Venue & { spaces: (Space & { reservations: Reservation[] })[] };
}


export const WeekViewCalendar: FC<WeekViewCalendarProps> = ({ venue }) => {
  const container = useRef(null);
  const containerNav = useRef(null);
  const containerOffset = useRef(null);
  const spaceIds = venue.spaces.map((space) => space.id);



  return (
    <div className="flex h-full flex-col">
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div
          style={{ width: "165%" }}
          className="flex max-w-full flex-none flex-col"
        >
          <div
            ref={containerNav}
            className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5 sm:pr-8"
          >
            <div
              className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500"
              style={{
                gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="col-end-1 w-14" />
              {venue.spaces.map((space, index) => (
                <div
                  key={space.id}
                  className="flex items-center justify-center py-3"
                >
                  <span className="flex items-baseline">{space.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Vertical lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-100 grid sm:pr-8"
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
                  )
                )}
              </div>

              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid"
                style={{
                  gridTemplateRows: `repeat(${timeLabels.length * 2}, 2rem)`,
                }}
              >
                <div
                  ref={containerOffset}
                  className="border-b border-gray-200"
                />

                {timeLabels.map((label, index) => (
                  <React.Fragment key={index}>
                    <div className="row-span-1 border-b border-gray-200">
                      <div className="sticky left-0 z-20 -ml-14 w-14 pr-2 -my-2.5 text-right text-xs/5 text-gray-400">
                        {label}
                      </div>
                    </div>
                    {/* 30min line */}
                    <div className="row-span-1 border-b border-gray-200"></div>
                  </React.Fragment>
                ))}
              </div>

              {/* Events */}

              <ReservationsSection venue={venue} spaceIds={spaceIds} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const GridSize = 32;
const ReservationsSection = ({ venue, spaceIds }: WeekViewCalendarProps & { spaceIds: string[] }) => {
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
      gridRow: `${rowIndex + 1} / span 1`,
      gridColumnStart: columnIndex + 1,
    }}
  />

}

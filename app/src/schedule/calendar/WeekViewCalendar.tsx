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
import { closestCorners, DndContext, MouseSensor, rectIntersection, TouchSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";

import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  createSnapModifier
} from '@dnd-kit/modifiers';

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
      modifiers={[restrictToVerticalAxis, createSnapModifier(GridSize), ({transform, ...rest}) => {

        const delta = Math.round(transform.y / (GridSize)) || 0;
        if (!draftReservation) return transform;


        function isCollision(reservation1: Reservation, reservation2: Reservation) {
         return reservation1.spaceId === reservation2.spaceId && reservation1.startTime < reservation2.endTime && reservation1.endTime > reservation2.startTime
        }

        const collision = reservations.find((reservation) => {
          if (isCollision(draftReservation, reservation)) {
            return reservation;
          }
          return undefined;
        });

        if (collision) {
          // If there's a collision, prevent the transformation
          return    {
            ...transform,
              x: transform.x,
              // go back one grid size
              y: transform.y < 0 ? Math.min(0, transform.y + GridSize) : Math.max(0, transform.y - GridSize)
            }
        }
        // If no collisions, allow the transformation
        return transform
      }]}
      onDragEnd={(e) => {
        const delta = Math.round(e.delta.y / (GridSize));
        console.log("Delta:", delta);
        if (!draftReservation) return;


        const draftStartTime = addMinutes(draftReservation.startTime, delta * 30);
        const draftEndTime = addMinutes(draftReservation.endTime, delta * 30);
        const isCollision = reservations.some((reservation) => {
          // Check if there's an overlap between the draftReservation and an existing reservation
          if (reservation.spaceId === draftReservation.spaceId && reservation.startTime < draftEndTime && reservation.endTime > draftStartTime) {
            return true;
          }
          return false;
        });
        if (isCollision) return;

        setDraftReservation({
          ...draftReservation,
          startTime: addMinutes(draftReservation.startTime, delta * 30),
          endTime: addMinutes(draftReservation.endTime, delta * 30),
        });
      }}
    >
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
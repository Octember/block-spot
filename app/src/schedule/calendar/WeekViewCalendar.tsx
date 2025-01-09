import { format } from 'date-fns';
import React, { FC, useCallback, useRef, useState } from 'react';
import { Reservation, Space, Venue } from 'wasp/entities';
import { GridSelection } from './selection';
import { ReservationSlot } from './reservation-slot';

const timeLabels = [
  '8AM', '9AM',
  '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM',
  '8PM',
];

const firstSpaceId = "1456beda-3377-482e-abb7-4c22222eec7c"
const secondSpaceId = "5340171c-a5c0-415e-be9c-5b1b96401d3f"

const MockReservations: Reservation[] = [
  {
    id: '1',
    spaceId: firstSpaceId,
    startTime: new Date('2025-01-01T09:00:00'),
    endTime: new Date('2025-01-01T10:00:00'),
    status: 'CONFIRMED',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'This is another description'
  },
  {
    id: '2',
    spaceId: secondSpaceId,
    startTime: new Date('2025-01-01T10:00:00'),
    endTime: new Date('2025-01-01T11:25:00'),
    status: 'CONFIRMED',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'This is a test description'
  },
  {
    id: '3',
    spaceId: firstSpaceId,
    startTime: new Date('2025-01-01T12:00:00'),
    endTime: new Date('2025-01-01T14:00:00'),
    status: 'CONFIRMED',
    userId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    description: 'Meeting with design team at Disney'
  },
]

interface WeekViewCalendarProps {
  venue: Venue & { spaces: Space[] }
}

export const WeekViewCalendar: FC<WeekViewCalendarProps> = ({ venue }) => {
  const container = useRef(null)
  const containerNav = useRef(null)
  const containerOffset = useRef(null)
  const spaceIds = venue.spaces.map(space => space.id)

  const [draftReservation, setDraftReservation] = useState<Reservation | null>(null)

  const handleSelectionComplete = useCallback((start: Date, end: Date, spaceIndex: number) => {
    console.log('Selection completed:', { start: format(start, 'h:mmaa'), end: format(end, 'h:mmaa'), spaceIndex });
    // Handle the new reservation creation here
    setDraftReservation({
      id: 'draft',
      spaceId: spaceIds[spaceIndex],
      startTime: start,
      endTime: end,
      status: "PENDING",
      userId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: 'Draft reservation'
    })
  }, [setDraftReservation])

  return (
    <div className="flex h-full flex-col">
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div style={{ width: '165%' }} className="flex max-w-full flex-none flex-col">
          <div ref={containerNav} className="sticky top-0 z-30 flex-none bg-white shadow ring-1 ring-black/5 sm:pr-8">

            <div className="-mr-px grid divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500" style={{
              gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`
            }}>
              <div className="col-end-1 w-14" />
              {venue.spaces.map((space, index) => (
                <div key={space.id} className="flex items-center justify-center py-3">
                  <span className="flex items-baseline">
                    {space.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-100 grid sm:pr-8"
                style={{
                  gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: venue.spaces.length + 1 }).map((_, index) => (
                  <div key={index} className={`col-start-${index + 1} row-span-full}`} />
                ))}
              </div>

              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid"
                style={{ gridTemplateRows: `repeat(${timeLabels.length * 2}, 2rem)` }}
              >
                <div ref={containerOffset} className="border-b border-gray-200" />

                {timeLabels.map((label, index) => (
                  <React.Fragment key={index}>
                    <div className='row-span-1 border-b border-gray-200'>
                      <div className="sticky left-0 z-20 -ml-14 w-14 pr-2 -my-2.5 text-right text-xs/5 text-gray-400">
                        {label}
                      </div>
                    </div>
                    {/* 30min line */}
                    <div className='row-span-1 border-b border-gray-200' ></div>
                  </React.Fragment>
                ))}
              </div>

              {/* Events */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid sm:pr-8"
                style={{
                  gridTemplateRows: `2rem repeat(${timeLabels.length * 2}, 2rem)`,
                  gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`
                }}
              >
                {MockReservations.map((reservation) => (
                  <ReservationSlot key={reservation.id} reservation={reservation} gridIndex={spaceIds.findIndex(spaceId => spaceId === reservation.spaceId)} />
                ))}
                {draftReservation && (
                  <ReservationSlot reservation={draftReservation} gridIndex={spaceIds.findIndex(spaceId => spaceId === draftReservation.spaceId)} isDraft />
                )}
              </ol>

              <GridSelection
                spaceCount={venue.spaces.length}
                timeLabels={timeLabels}
                onSelectionComplete={handleSelectionComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}





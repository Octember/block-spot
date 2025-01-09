import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useRef, FC, useState, useCallback } from 'react'
import { Reservation, Space, Venue } from 'wasp/entities';
import { format } from 'date-fns'
import { GridSelection } from './selection';

const timeLabels = [
  // '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', 
  '8AM', '9AM',
  '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM',
  '8PM',
  // '9PM', '10PM', '11PM'
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
                  gridTemplateRows: `1.75rem repeat(${timeLabels.length * 2}, 2rem)`,
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

export const ReservationSlot = ({ reservation, gridIndex, isDraft }: { reservation: Reservation; gridIndex: number; isDraft?: boolean }) => {
  // TODO: start and end row are not correct, current hardcoded to 8AM
  const startRow = 1 + Math.ceil((reservation.startTime.getHours() * 2 + reservation.startTime.getMinutes() / 30) - (7 * 2 + 1))
  const endRow = 1 + Math.ceil((reservation.endTime.getHours() * 2 + reservation.endTime.getMinutes() / 30) - (7 * 2 + 1))
  const rowSpan = Math.round(endRow - startRow)
  console.log(reservation.description, { startRow, endRow, rowSpan, })

  const colorStyles = isDraft ? 'bg-pink-100 hover:bg-pink-200' : 'bg-blue-50 hover:bg-blue-100'

  return <li className="relative mt-px flex" style={{
    gridRow: `${startRow} / span ${rowSpan}`,
    gridColumnStart: gridIndex + 1
  }}>
    <a
      href="#"
      className={`group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 ${colorStyles}`}
    >
      <p className="order-1 font-semibold text-blue-700">{reservation.description}</p>
      <p className="text-blue-500 group-hover:text-blue-700">
        <time dateTime="2022-01-12T06:00">{format(reservation.startTime, 'h:mm a')} - {format(reservation.endTime, 'h:mm a')}</time>
      </p>
    </a>
  </li>
}



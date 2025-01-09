import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import React, { useEffect, useRef, FC } from 'react'
import { Reservation, Space, Venue } from 'wasp/entities';
import { format } from 'date-fns'

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

  // useEffect(() => {
  //   // Set the container scroll position based on the current time.
  //   const currentMinute = new Date().getHours() * 60
  //   container.current.scrollTop =
  //     ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
  //       currentMinute) /
  //     1440
  // }, [])

  const spaceIds = venue.spaces.map(space => space.id)
  console.log({ spaceIds })
  return (
    <div className="flex h-full flex-col">
      <Header name={venue.name} />
      <div ref={container} className="isolate flex flex-auto flex-col overflow-auto bg-white">
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
              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                style={{ gridTemplateRows: `repeat(${timeLabels.length * 2}, minmax(3rem, 1fr))` }}
              >
                <div ref={containerOffset} className="row-end-1 h-2" />
                {timeLabels.map((label, index) => (
                  <React.Fragment key={index}>
                    <div>
                      <div className="sticky left-0 z-20 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs/5 text-gray-400">
                        {label}
                      </div>
                    </div>
                    {/* 30min line */}
                    <div />
                  </React.Fragment>
                ))}
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 grid-rows-1 divide-x divide-gray-100 grid sm:pr-8"
                style={{
                  gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: venue.spaces.length + 1 }).map((_, index) => (
                  <div key={index} className={`col-start-${index + 1} row-span-full ${index === 7 ? 'w-8' : ''}`} />
                ))}
              </div>

              {/* Events */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid sm:pr-8"
                style={{
                  gridTemplateRows: `1.75rem repeat(${timeLabels.length * 12}, minmax(8px, 1fr)) auto`,
                  gridTemplateColumns: `repeat(${venue.spaces.length}, minmax(0, 1fr))`
                }}
              >
                {MockReservations.map((reservation) => (
                  <ReservationSlot key={reservation.id} reservation={reservation} gridIndex={spaceIds.findIndex(spaceId => spaceId === reservation.spaceId)} />
                ))}
              </ol>
            </div>
          </div>



        </div>
      </div>
    </div >
  )
}

export const ReservationSlot = ({ reservation, gridIndex }: { reservation: Reservation; gridIndex: number }) => {
  // TODO: start and end row are not correct, current hardcoded to 8AM
  const startRow = (reservation.startTime.getHours() * 12 + reservation.startTime.getMinutes() / 60) - (8 * 12) || 1
  const endRow = (reservation.endTime.getHours() * 12 + reservation.endTime.getMinutes() / 60) - (8 * 12)
  const rowSpan = Math.round(endRow - startRow)
  console.log(reservation.description, { rowSpan, startRow, endRow })

  return <li className="relative mt-px flex col-start-1" style={{
    gridRow: `${startRow} / span ${rowSpan}`,
    gridColumnStart: gridIndex + 1
  }}>
    <a
      href="#"
      className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-blue-50 p-2 text-xs/5 hover:bg-blue-100"
    >
      <p className="order-1 font-semibold text-blue-700">{reservation.description}</p>
      <p className="text-blue-500 group-hover:text-blue-700">
        <time dateTime="2022-01-12T06:00">{format(reservation.startTime, 'h:mm a')} - {format(reservation.endTime, 'h:mm a')}</time>
      </p>
    </a>
  </li>
}


const Header = ({ name }: { name: string }) => {
  return <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
    <h1 className="text-base font-semibold text-gray-900">
      <time dateTime="2022-01">{name}</time>
    </h1>
    <div className="flex items-center">
      <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
        <button
          type="button"
          className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
        >
          <span className="sr-only">Previous week</span>
          <ChevronLeftIcon className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
        >
          Today
        </button>
        <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
        <button
          type="button"
          className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
        >
          <span className="sr-only">Next week</span>
          <ChevronRightIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      <Menu as="div" className="relative ml-6 md:hidden">
        <MenuButton className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500">
          <span className="sr-only">Open menu</span>
          <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
        </MenuButton>

        <MenuItems
          transition
          className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
        >
          <div className="py-1">
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Create event
              </a>
            </MenuItem>
          </div>
          <div className="py-1">
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Go to today
              </a>
            </MenuItem>
          </div>
          <div className="py-1">
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Day view
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Week view
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Month view
              </a>
            </MenuItem>
            <MenuItem>
              <a
                href="#"
                className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:text-gray-900 data-[focus]:outline-none"
              >
                Year view
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>
    </div>
  </header>
}

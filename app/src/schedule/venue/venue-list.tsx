

import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { FC } from 'react'
import { Space, Venue } from 'wasp/entities'
import { Link, routes } from 'wasp/client/router'
import { format } from 'date-fns'


export const VenueList: FC<{ venues: (Venue & { spaces: Space[] })[] }> = ({ venues }) => {
  return (
    <ul role="list" className="divide-y divide-gray-100 [&>*:first-child]:rounded-t-3xl [&>*:last-child]:rounded-b-3xl">
      {venues.map((venue) => (
        <li
          key={venue.id}
          className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6 lg:px-8"
        >
          <div className="flex min-w-0 gap-x-4">
            <div className="min-w-0 flex-auto flex-col">
              <p className="text-sm/6 font-semibold text-gray-900">
                <Link to={routes.VenuePageRoute.to} params={{ venueId: venue.id }}>
                  <span className="absolute inset-x-0 -top-px bottom-0" />
                  {venue.name}
                </Link>
              </p>
              <p className="mt-1 flex text-xs/5 text-gray-500">
                <a href={`mailto:${""}`} className="relative truncate hover:underline">
                  {venue.address}
                </a>
              </p>
              <p className='text-sm'>Created on {format(venue.createdAt, 'yyyy-MM-dd')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-x-4">
            <div className="hidden sm:flex sm:flex-col sm:items-end">
              <p className="text-sm/6 text-gray-900">{venue.spaces.length} spaces ({venue.spaces.map(space => space.type).join(', ')})</p>

              <div className="mt-1 flex items-center gap-x-1.5">
                <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                  <div className="size-1.5 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs/5 text-gray-500">Online</p>
              </div>
            </div>
            <ChevronRightIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
          </div>
        </li>
      ))}
    </ul>
  )
}

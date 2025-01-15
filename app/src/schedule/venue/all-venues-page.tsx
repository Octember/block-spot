
import {
  getAllVenues,
  useQuery
} from 'wasp/client/operations';

import { VenueList } from './venue-list';

import { AddVenueButton } from './add-venue/add-venue-button';

export default function VenuePage() {

  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-full px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl flex justify-between'>
          <h2 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white'>
            Your <span className='text-yellow-600'>Venues</span>
          </h2>

          <AddVenueButton />
        </div>

        <div className='my-8 border rounded-3xl'>
          <div className='sm:w-[90%] md:w-[80%] lg:w-[70%] py-10 px-6 mx-auto my-8 space-y-10 '>
            <div className='flex flex-col justify-center gap-10 border-gray-900/10 dark:border-gray-100/10'>
              <VenueList venues={venues || []} />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}



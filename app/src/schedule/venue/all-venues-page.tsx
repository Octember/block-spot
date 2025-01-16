
import {
  getAllVenues,
  useQuery
} from 'wasp/client/operations';

import { VenueList } from './venue-list';

import { AddVenueButton } from './add-venue/add-venue-button';

export default function VenuePage() {

  const { data: venues, isLoading: isVenueLoading } = useQuery(getAllVenues);

  return (
    <div className='py-10 lg:mt-6'>
      <div className='mx-auto max-w-full px-6 lg:px-8 bg'>
        <div className='mx-auto max-w-4xl flex justify-between'>
          <h2 className='text-4xl font-bold tracking-tight text-gray-900 dark:text-white'>
            Your <span className='text-yellow-600'>Venues</span>
          </h2>

          <AddVenueButton />
        </div>

        <div className='my-8 border rounded-3xl bg-white dark:bg-boxdark-2 lg:w-[80%] xl:w-[70%] mx-auto'>
          <div className='space-y-10 rounded-3xl'>
            <div className='flex flex-col justify-center gap-10 border-gray-900/10 dark:border-gray-100/10'>
              <VenueList venues={venues || []} />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}



import { useParams } from 'react-router-dom';
import { getVenueById, useQuery } from 'wasp/client/operations';
import { UpdateVenueForm } from './update-venue-form';
import { useToast } from '../../../client/toast';
import { Button } from '../../../client/components/button';
import { ArrowUpRightIcon, PencilIcon } from '@heroicons/react/20/solid';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';

export default function VenuePage() {
  const toast = useToast();
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, { venueId: venueId || '' });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <div className='flex flex-col gap-4 p-4 mt-2 border border-gray-200 rounded-md lg:max-w-4xl mx-auto'>

      <div className='flex justify-between items-center font-bold text-lg'>
        {venue.name}
        <WaspRouterLink
          to={routes.ScheduleRoute.to}
          params={{ venueId }}
          className='flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-yellow-500'
        >
          <Button variant='secondary' icon={<ArrowUpRightIcon className='size-4' />} onClick={() => { }}>
            View Schedule
          </Button>
        </WaspRouterLink>
      </div>

      <UpdateVenueForm onSuccess={() => toast({ title: 'Venue updated', description: 'Venue updated successfully' })} venue={venue} />
    </div >
  )
}
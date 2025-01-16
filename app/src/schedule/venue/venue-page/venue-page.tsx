import { useParams } from 'react-router-dom';
import { getVenueById, useQuery } from 'wasp/client/operations';
import { useToast } from '../../../client/toast';
import { UpdateVenueForm } from './update-venue-form';

export default function VenuePage() {
  const toast = useToast();
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, { venueId: venueId || '' });

  if (isLoading) return <div>Loading...</div>;

  if (!venueId || !venue) return <div>Venue not found</div>;

  return (
    <div className='flex flex-col gap-4 p-4 mt-4 border border-gray-200 rounded-md lg:max-w-4xl mx-auto'>

      <UpdateVenueForm
        onSuccess={() => toast({ title: 'Venue updated', description: 'Venue updated successfully' })}
        venue={venue}
      />
    </div >
  )
}
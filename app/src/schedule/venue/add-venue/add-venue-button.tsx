import { PlusIcon } from '@heroicons/react/20/solid';
import { Button } from '../../../client/components/button';
import { Modal } from '../../../client/components/modal';
import { useState } from 'react';
import { CreateVenueForm } from './create-venue-form';
import { useToast } from '../../../client/toast';

export function AddVenueButton() {
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return <>
    <Button ariaLabel="Add Venue" icon={<PlusIcon className='size-4' />} onClick={() => { setIsModalOpen(true) }}> Add Venue </Button>
    <Modal open={isModalOpen} onClose={() => { setIsModalOpen(false) }}>
      <CreateVenueForm onSuccess={(data) => {
        setIsModalOpen(false);
        toast({ title: 'Venue created', description: `${data.venueName} created` })
      }} />
    </Modal>
  </>
}


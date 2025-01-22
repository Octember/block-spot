import { PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useForm, SubmitHandler } from "react-hook-form";
import { updateSpace } from 'wasp/client/operations';
import { Modal } from '../../../client/components/modal';
import { useToast } from '../../../client/toast';
import { Button } from '../../../client/components/button';
import { TextInput } from '../../../client/components/form/text-input';
import { FormField } from '../../../client/components/form/form-field';

type Space = {
  id: string;
  name: string;
  capacity: number;
  type?: string;
};

type UpdateSpaceFormInputs = {
  name: string;
  capacity: number;
  type: string;
};

export const UpdateSpaceButton = ({ space }: { space: Space }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<UpdateSpaceFormInputs>({
    defaultValues: {
      name: space.name,
      capacity: space.capacity,
      type: space.type || 'ROOM',
    },
  });

  const onSubmit: SubmitHandler<UpdateSpaceFormInputs> = async (data) => {
    try {
      await updateSpace({
        spaceId: space.id,
        name: data.name,
        capacity: data.capacity,
        type: data.type,
      });
      setIsOpen(false);
      toast({
        type: 'success',
        title: 'Space updated successfully',
      });
    } catch (error) {
      console.error('Failed to update space:', error);
      toast({
        type: 'error',
        title: 'Failed to update space',
        description: 'Please try again later',
      });
    }
  };

  return (
    <>
      <Button
        ariaLabel="Edit space"
        variant="tertiary"
        icon={<PencilIcon className="size-4 stroke-gray-500 hover:stroke-blue-700" />}
        onClick={() => setIsOpen(true)}
      />

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        heading={{
          title: "Update Space",
          description: "Update the space details below."
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name">
            <TextInput
              type="text"
              placeholder="Enter space name"
              {...register("name", { required: true })}
            />
          </FormField>

          <FormField label="Capacity">
            <TextInput
              type="number"
              min="1"
              placeholder="Enter capacity"
              {...register("capacity", {
                required: true,
                valueAsNumber: true,
                min: 1,
              })}
            />
          </FormField>

          <FormField label="Type">
            <TextInput
              type="text"
              placeholder="Enter space type"
              {...register("type")}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              type="button"
              ariaLabel="Cancel update"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              ariaLabel="Save changes"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}; 
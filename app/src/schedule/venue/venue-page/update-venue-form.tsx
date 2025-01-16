import { ArrowUpRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { updateVenue } from "wasp/client/operations";
import { Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { TextInput } from '../../../client/components/form/text-input';
import { FormField } from "../../../client/components/form/form-field";
import { Link as WaspRouterLink, routes } from 'wasp/client/router';

type UpdateVenueFormInputs = {
  name: string
  spaces: {
    id: string
    name: string
  }[]
}

export function UpdateVenueForm(
  { onSuccess, venue }: { onSuccess: (data: UpdateVenueFormInputs) => void, venue: Venue & { spaces: Space[] } }
) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateVenueFormInputs>({
    defaultValues: {
      name: venue.name,
      spaces: venue.spaces
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "spaces",
  });

  const onSubmit: SubmitHandler<UpdateVenueFormInputs> = async (data) => {
    await updateVenue({ id: venue.id, name: data.name, spaces: data.spaces.map(space => ({ id: space.id, name: space.name })) })
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      <div className="flex flex-row justify-between items-center">
        <div className="w-1/2">
          <FormField label="Venue Name">
            <TextInput required {...register("name")} />
          </FormField>
        </div>
        <div className="w-1/2 flex justify-end">
          <WaspRouterLink
            to={routes.ScheduleRoute.to}
            params={{ venueId: venue.id }}
            className='flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-yellow-500'
          >
            <Button variant='secondary' ariaLabel="View Schedule" icon={<ArrowUpRightIcon className='size-4' />} onClick={() => { }}>
              View Schedule
            </Button>
          </WaspRouterLink>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-md font-semibold'>Spaces</h2>
        {fields.map((field, index) => (
          <div key={field.id} className='flex gap-2'>
            <TextInput key={field.id} {...register(`spaces.${index}.name`)} />
            <Button
              type="button"
              variant="secondary"
              ariaLabel="Remove Space"
              icon={<XMarkIcon className='size-4' />}
              onClick={() => remove(index)}>
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            ariaLabel="Add Space"
            icon={<PlusIcon className='size-4' />}
            onClick={() => append({ name: '', id: '' })}>
            Add Space
          </Button>
        </div>
      </div>

      <div className='flex gap-4'>
        <Button disabled={!isDirty} type="submit" ariaLabel="Update Venue">Update Venue</Button>
        <Button disabled type="button" variant="danger" onClick={() => { }} ariaLabel="Delete Venue">Delete Venue</Button>
      </div>
    </form>
  )
}
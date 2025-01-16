import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { updateVenue } from "wasp/client/operations";
import { Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { TextInput } from '../../../client/components/form/text-input';

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
      <div className='flex flex-col gap-2'>
        <label htmlFor="name">Venue Name</label>
        <TextInput required {...register("name")} />
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-semibold'>Spaces</h2>
        {fields.map((field, index) => (
          <div key={field.id} className='flex gap-2'>
            <TextInput key={field.id} {...register(`spaces.${index}.name`)} />
            <Button
              type="button"
              variant="secondary" icon={<XMarkIcon className='size-4' />}
              onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
        <div>
          <Button type="button" variant="secondary" icon={<PlusIcon className='size-4' />} onClick={() => append({ name: '', id: '' })}>Add Space</Button>
        </div>
      </div>

      <div className='flex gap-4'>
        <Button disabled={!isDirty} type="submit">Update Venue</Button>
        <Button disabled type="button" variant="danger" onClick={() => { }}>Delete Venue</Button>
      </div>
    </form>
  )
}
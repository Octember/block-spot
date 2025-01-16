import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../../../client/components/button";
import { createVenue } from "wasp/client/operations";
import { TextInput } from '../../../client/components/form/text-input';
import { FormField } from "../../../client/components/form/form-field";

type CreateVenueFormInputs = {
  venueName: string
}

export function CreateVenueForm(
  { onSuccess }: { onSuccess: (data: CreateVenueFormInputs) => void }
) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateVenueFormInputs>()
  const onSubmit: SubmitHandler<CreateVenueFormInputs> = async (data) => {
    await createVenue({ name: data.venueName })
    onSuccess(data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
      {/* register your input into the hook by invoking the "register" function */}
      <FormField label="Venue Name">
        <TextInput required {...register("venueName")} placeholder="Venue Name" />
      </FormField>
      {errors.venueName && <span>This field is required</span>}

      <div className="flex justify-end">
        <Button type="submit">Create Venue</Button>
      </div>
    </form>
  )
}
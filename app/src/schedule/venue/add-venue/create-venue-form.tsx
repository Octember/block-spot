import { SubmitHandler, useForm } from "react-hook-form";
import { Button } from "../../../client/components/button";
import { createVenue } from "wasp/client/operations";

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
      <input required {...register("venueName")} />
      {errors.venueName && <span>This field is required</span>}

      <Button type="submit">Create Venue</Button>
    </form>
  )
}
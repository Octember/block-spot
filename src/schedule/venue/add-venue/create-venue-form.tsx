import { SubmitHandler, useForm } from "react-hook-form";
import { createVenue } from "wasp/client/operations";
import { Button } from "../../../client/components/button";
import { FormField } from "../../../client/components/form/form-field";
import { TextInput } from "../../../client/components/form/text-input";

type CreateVenueFormInputs = {
  venueName: string;
  announcements: string;
};

export function CreateVenueForm({
  onSuccess,
}: {
  onSuccess: (data: CreateVenueFormInputs) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateVenueFormInputs>({
    defaultValues: {
      venueName: "",
      announcements: "",
    },
  });
  const onSubmit: SubmitHandler<CreateVenueFormInputs> = async (data) => {
    await createVenue({ name: data.venueName });
    onSuccess(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* register your input into the hook by invoking the "register" function */}
      <FormField label="Venue Name">
        <TextInput
          required
          {...register("venueName")}
          placeholder="Venue Name"
        />
      </FormField>
      {errors.venueName && <span>This field is required</span>}

      <FormField
        label="Announcements"
        description="Add any important announcements or notices for your venue"
      >
        <textarea
          {...register("announcements")}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          rows={4}
          placeholder="Enter any announcements or important notices for your venue..."
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" ariaLabel="Create Venue">
          Create Venue
        </Button>
      </div>
    </form>
  );
}

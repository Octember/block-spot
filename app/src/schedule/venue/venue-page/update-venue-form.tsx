import {
  ArrowUpRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  SubmitHandler,
  useFieldArray,
  useForm,
  Controller,
} from "react-hook-form";
import { updateVenue } from "wasp/client/operations";
import { Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { TextInput } from "../../../client/components/form/text-input";
import { FormField } from "../../../client/components/form/form-field";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useToast } from "../../../client/toast";
import { Select } from "../../../client/components/form/select";
import { timeLabels } from "../../calendar/constants";

type UpdateVenueFormInputs = {
  name: string;
  spaces: {
    id: string;
    name: string;
  }[];
  displayStartHour: number;
  displayEndHour: number;
};

export function UpdateVenueForm({
  venue,
}: {
  venue: Venue & { spaces: Space[] };
}) {
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateVenueFormInputs>({
    defaultValues: {
      name: venue.name,
      spaces: venue.spaces,
      displayStartHour: venue.displayStartHour,
      displayEndHour: venue.displayEndHour,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "spaces",
  });

  const onSubmit: SubmitHandler<UpdateVenueFormInputs> = async (data) => {
    try {
      await updateVenue({
        id: venue.id,
        name: data.name,
        spaces: data.spaces,
        displayStartHour: data.displayStartHour,
        displayEndHour: data.displayEndHour,
      });
      toast({
        title: "Venue updated",
        description: "Venue updated successfully",
      });
    } catch (error) {
      toast({
        type: "error",
        title: "Something went wrong",
        description: JSON.stringify(error) || "Please try again",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            className="flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-yellow-500"
          >
            <Button
              variant="secondary"
              ariaLabel="View Schedule"
              icon={<ArrowUpRightIcon className="size-4" />}
              onClick={() => { }}
            >
              View Schedule
            </Button>
          </WaspRouterLink>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-md font-semibold">Spaces</h2>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <TextInput key={field.id} {...register(`spaces.${index}.name`)} />
            <Button
              type="button"
              variant="secondary"
              ariaLabel="Remove Space"
              icon={<XMarkIcon className="size-4" />}
              onClick={() => remove(index)}
            ></Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            ariaLabel="Add Space"
            icon={<PlusIcon className="size-4" />}
            onClick={() => append({ name: "", id: "" })}
          >
            Add Space
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-md font-semibold">Display Hours</h2>
        <div className="flex gap-2 items-center">
          {/* TODO: Add a dropdown for the hours */}
          <span className="">Show the hours from</span>

          <Controller
            name="displayStartHour"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                options={Array.from({ length: 24 }, (_, i) => ({
                  label: timeLabels[i],
                  value: String(i),
                }))}
                onChange={onChange}
                value={{ label: timeLabels[value], value: String(value) }}
              />
            )}
          />
          <span className="">to</span>

          <Controller
            name="displayEndHour"
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                options={Array.from({ length: 24 }, (_, i) => ({
                  label: timeLabels[i],
                  value: String(i),
                }))}
                onChange={(value) => onChange(Number(value.value))}
                value={{ label: timeLabels[value], value: String(value) }}
              />
            )}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button disabled={!isDirty} type="submit" ariaLabel="Update Venue">
          Update Venue
        </Button>
        <Button
          disabled
          type="button"
          variant="danger"
          onClick={() => { }}
          ariaLabel="Delete Venue"
        >
          Delete Venue
        </Button>
      </div>
    </form>
  );
}

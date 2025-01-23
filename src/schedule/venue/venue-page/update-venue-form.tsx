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
  Control,
} from "react-hook-form";
import {
  getVenueById,
  updateVenue,
  updateVenueAvailability,
  useQuery,
} from "wasp/client/operations";
import { AvailabilityRule, Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { TextInput } from "../../../client/components/form/text-input";
import { FormField } from "../../../client/components/form/form-field";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { useToast } from "../../../client/toast";
import { Select, MultiSelect } from "../../../client/components/form/select";
import { timeLabels } from "../../calendar/constants";
import { AvailabilityRuleForm } from "./availability";
import { UpdateVenueFormInputs } from "./types";
import { useScheduleContext } from "../../calendar/providers/schedule-query-provider";
import { useEffect } from "react";

function transformToFormInputs(
  venue: Venue & { spaces: Space[]; availabilityRules: AvailabilityRule[] },
): UpdateVenueFormInputs {
  return {
    name: venue.name,
    spaces: venue.spaces,
    displayStart: venue.displayStart / 60,
    displayEnd: venue.displayEnd / 60,
    availabilityRules: venue.availabilityRules,
  };
}

export function UpdateVenueForm({
  venue,
}: {
  venue: Venue & { spaces: Space[]; availabilityRules: AvailabilityRule[] };
}) {
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateVenueFormInputs>({
    defaultValues: transformToFormInputs(venue),
  });

  useEffect(() => {
    reset(transformToFormInputs(venue));
  }, [venue]);

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
        displayStart: data.displayStart * 60,
        displayEnd: data.displayEnd * 60,
      });

      await updateVenueAvailability({
        id: venue.id,
        availabilityRules: data.availabilityRules,
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
      <div className="flex flex-row justify-between">
        <div className="w-1/2">
          <FormField
            label="Venue Name"
            description="The name of your venue that will be displayed to customers when they make a booking"
          >
            <TextInput required {...register("name")} />
          </FormField>
        </div>
        <div className="w-1/2 h-full flex justify-end">
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

      <div className="flex gap-4">
        <Button
          disabled={!isDirty}
          type="submit"
          ariaLabel="Update Venue"
          variant={isDirty ? "primary" : "secondary"}
        >
          Update Venue
        </Button>
      </div>
    </form>
  );
}

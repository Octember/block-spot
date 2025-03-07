import { ArrowUpRightIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { updateVenue, updateVenueAvailability } from "wasp/client/operations";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { AvailabilityRule, Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { FormField } from "../../../client/components/form/form-field";
import { Select } from "../../../client/components/form/select";
import { TextInput } from "../../../client/components/form/text-input";
import { useToast } from "../../../client/toast";
import { TimeZoneOptions } from "../../../organization/onboarding/constants";
import { UpdateVenueFormInputs } from "./types";

function transformToFormInputs(
  venue: Venue & { spaces: Space[]; availabilityRules: AvailabilityRule[] },
): UpdateVenueFormInputs {
  return {
    name: venue.name,
    spaces: venue.spaces,
    displayStart: venue.displayStart / 60,
    displayEnd: venue.displayEnd / 60,
    announcements: venue.announcements,
    availabilityRules: venue.availabilityRules,
    contactEmail: venue.contactEmail,
    timeZoneId: venue.timeZoneId,
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
    handleSubmit,
    reset,
    control,
    formState: { isDirty, isSubmitting },
  } = useForm<UpdateVenueFormInputs>({
    defaultValues: transformToFormInputs(venue),
  });

  useEffect(() => {
    reset(transformToFormInputs(venue));
  }, [venue]);

  const onSubmit: SubmitHandler<UpdateVenueFormInputs> = async (data) => {
    try {
      await updateVenue({
        id: venue.id,
        name: data.name,
        spaces: data.spaces,
        displayStart: data.displayStart * 60,
        displayEnd: data.displayEnd * 60,
        announcements: data.announcements,
        contactEmail: data.contactEmail,
        timeZoneId: data.timeZoneId,
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 bg-white p-4 rounded-md border border-gray-200 shadow-sm"
    >
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
              onClick={() => {}}
            >
              View Schedule
            </Button>
          </WaspRouterLink>
        </div>
      </div>

      <div>
        <FormField
          label="Contact Email"
          description="The email address that customers will use to contact you"
        >
          <TextInput type="email" required {...register("contactEmail")} />
        </FormField>
      </div>

      <div>
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
      </div>

      <div>
        <FormField
          label="Time Zone"
          description="Set the local timezone for your venue to ensure accurate scheduling and time displays."
        >
          <Controller
            control={control}
            name="timeZoneId"
            render={({ field: { value, onChange } }) => (
              <Select
                options={TimeZoneOptions}
                value={
                  TimeZoneOptions.find((tz) => tz.value === value) || {
                    value: "America/New_York",
                    label: "America/New_York",
                  }
                }
                onChange={(value) => onChange(value.value)}
              />
            )}
          />
        </FormField>
      </div>

      <div className="flex gap-4">
        <Button
          disabled={!isDirty || isSubmitting}
          isLoading={isSubmitting}
          type="submit"
          ariaLabel="Update Venue"
        >
          Update Venue
        </Button>
      </div>
    </form>
  );
}

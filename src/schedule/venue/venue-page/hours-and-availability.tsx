import { useEffect } from "react";
import {
  Controller,
  SubmitHandler,
  useForm
} from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  getVenueById,
  updateVenue,
  updateVenueAvailability,
  useQuery
} from "wasp/client/operations";
import { AvailabilityRule, Space, Venue } from "wasp/entities";
import { Button } from "../../../client/components/button";
import { FormField } from "../../../client/components/form/form-field";
import { Select } from "../../../client/components/form/select";
import { SidebarLayout } from "../../../client/components/layouts/sidebar-layout";
import { useToast } from "../../../client/toast";
import { timeLabels } from "../../calendar/constants";
import { AvailabilityRuleForm } from "./availability";
import { UpdateVenueFormInputs } from "./types";

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

export function HoursAndAvailabilityPage() {
  const { venueId } = useParams();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId || "",
  });

  if (isLoading) return null;

  if (!venueId || !venue) return null;
  return (
    <SidebarLayout
      header={{
        title: "Availability",
        description: "Manage your venue availability",
      }}
    >
      {venue && <HoursAndAvailabilityForm venue={venue} />}
    </SidebarLayout>
  );
}

export function HoursAndAvailabilityForm({
  venue,
}: {
  venue: NonNullable<Awaited<ReturnType<typeof getVenueById>>>;
}) {
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
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
      className="flex flex-col gap-6 bg-white p-4 rounded-lg"
    >
      <div className="flex flex-col gap-2">
        <FormField
          label="Display Hours"
          description="Configure which hours of the day to show in the schedule view"
        >
          <div className="flex gap-2 items-center text-md">
            <span className="items-center">Show the hours from</span>
            <Controller
              name="displayStart"
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
            <span className="">to</span>

            <Controller
              name="displayEnd"
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
        </FormField>
      </div>

      <AvailabilityRuleForm control={control} />

      <div className="flex gap-4">
        <Button
          disabled={!isDirty}
          type="submit"
          ariaLabel="Update Venue"
          variant={isDirty ? "primary" : "secondary"}
        >
          Update Venue
        </Button>
        {/* <Button
          disabled
          type="button"
          variant="danger"
          onClick={() => { }}
          ariaLabel="Delete Venue"
        >
          Delete Venue
        </Button> */}
      </div>
    </form>
  );
}

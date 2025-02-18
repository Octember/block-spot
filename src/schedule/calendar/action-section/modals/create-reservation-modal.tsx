import { Controller, useForm, FormProvider } from "react-hook-form";
import { Button } from "../../../../client/components/button";
import { FormField } from "../../../../client/components/form/form-field";
import { Modal } from "../../../../client/components/modal";
import { usePendingChanges } from "../../providers/pending-changes-provider";

import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { parse } from "date-fns";
import { FC } from "react";
import { createReservation } from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { Select } from "../../../../client/components/form/select";
import { TextInput } from "../../../../client/components/form/text-input";
import { useToast } from "../../../../client/toast";
import { useTimeLabelsLong15Minutes } from "../../constants";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { useVenueContext } from "../../providers/venue-provider";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { DateInput } from "../components/date-input";
import { TimeRangeSelect } from "../components/time-range-select";
import { CreateReservationFormInputs } from './types';


function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const CreateReservationModal: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { cancelChange } = usePendingChanges();
  const { venue, getSpaceById } = useVenueContext();
  const { refresh } = useScheduleContext();
  const timeLabelsLong15Minutes = useTimeLabelsLong15Minutes();
  const toast = useToast();
  const { isOwner } = useAuthUser();

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
    },
  });
  const { control, register, handleSubmit, watch, formState: { isSubmitting, submitCount } } = form;

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  async function onSubmit(data: CreateReservationFormInputs) {
    await createReservation({
      startTime: minutesToTime(data.date, data.startTimeMinutes),
      endTime: minutesToTime(data.date, data.endTimeMinutes),
      description: data.title,
      spaceId: data.spaceId,
    });

    refresh();
    toast({
      title: "Reservation created",
      description: "The reservation has been created",
    });

    setTimeout(() => {
      cancelChange();
    }, 300);
  }

  return (
    <Modal
      className="flex"
      open={true}
      size="lg"
      onClose={() => { }}
      heading={{ title: "New Reservation" }}
      footer={
        <div className="flex items-center justify-end space-x-3 m-2">
          <Button
            onClick={cancelChange}
            ariaLabel="Cancel"
            variant="secondary"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || submitCount > 0}
            isLoading={isSubmitting || submitCount > 0}
            icon={<ArrowRightCircleIcon className="w-6 h-6" />}
            ariaLabel="Confirm"
            variant="primary"
            size="lg"
          >
            Create Booking
          </Button>
        </div>
      }
    >
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField label="Date" required>
            <DateInput
              startTimeMinutes={startTimeMinutes}
              endTimeMinutes={endTimeMinutes}
              reservation={reservation}
            />
          </FormField>

          <TimeRangeSelect />

          <FormField label="Space" required>
            <Controller
              name="spaceId"
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  options={venue.spaces.map((space) => ({
                    label: space.name,
                    value: space.id,
                  }))}
                  value={{ label: getSpaceById(value)?.name || "", value: value }}
                  onChange={(value) => {
                    onChange(value.value);
                  }}
                />
              )}
            />
          </FormField>

          <FormField label="Reservation Title">
            <TextInput {...register("title")} />
          </FormField>
        </form>
      </FormProvider>
    </Modal>
  );
};

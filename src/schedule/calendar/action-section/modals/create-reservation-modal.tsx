import { Controller, FormProvider, useForm } from "react-hook-form";
import { Modal } from "../../../../client/components/modal";
import { usePendingChanges } from "../../providers/pending-changes-provider";

import { FC } from "react";
import { createReservation } from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { useToast } from "../../../../client/toast";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { useVenueContext } from "../../providers/venue-provider";
import { UpdateReservationActionButtons } from "../components/action-buttons";
import { DateInput } from "../components/date-input";
import { TimeRangeSelect } from "../components/time-range-select";
import { UpdateReservationUserSection } from '../forms/update-user-section';
import { CreateReservationFormInputs } from "./types";
import { FormField } from "../../../../client/components/form/form-field";
import { Select } from "../../../../client/components/form/select";
import { TextInput } from "../../../../client/components/form/text-input";

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
  const toast = useToast();
  const { isAdmin } = useAuthUser();

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
    },
  });

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, submitCount },
  } = form;

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

  const enableUserSection = isAdmin;

  return (
    <Modal
      className="flex"
      open={true}
      size="2xl"
      onClose={() => cancelChange()}
      heading={{ title: "New Reservation" }}
      footer={
        <UpdateReservationActionButtons
          onCancel={cancelChange}
          onClick={handleSubmit(onSubmit)}
          isLoading={isSubmitting || submitCount > 0}
        />
      }
    >
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`grid ${enableUserSection ? "sm:grid-cols-2" : ""} grid-cols-1 gap-12`}
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Date & Time</h2>
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
                    value={{
                      label: getSpaceById(value)?.name || "",
                      value: value,
                    }}
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
          </div>

          {enableUserSection && (
            <UpdateReservationUserSection />
          )}
        </form>
      </FormProvider>
    </Modal >
  );
};


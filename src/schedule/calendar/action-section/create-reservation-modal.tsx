import { Controller, useForm } from "react-hook-form";
import { Button } from "../../../client/components/button";
import { FormField } from "../../../client/components/form/form-field";
import { Modal } from "../../../client/components/modal";
import { usePendingChanges } from "../providers/pending-changes-provider";

import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { parse } from "date-fns";
import { BiLoaderCircle } from "react-icons/bi";
import { createReservation } from "wasp/client/operations";
import { Select } from "../../../client/components/form/select";
import { TextInput } from "../../../client/components/form/text-input";
import { useToast } from "../../../client/toast";
import { timeLabelsLong15Minutes } from "../constants";
import { useScheduleContext } from "../providers/schedule-query-provider";

type CreateReservationFormInputs = {
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  spaceId: string;
  title: string;
};

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const CreateReservationModal = () => {
  const { pendingChange, cancelChange, setPendingChange } = usePendingChanges();
  const { venue, getSpaceById } = useScheduleContext();
  const toast = useToast();

  if (!pendingChange) return null;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: pendingChange.newState.startTime,
      startTimeMinutes: timeToMinutes(pendingChange.newState.startTime),
      endTimeMinutes: timeToMinutes(pendingChange.newState.endTime),
      title: pendingChange.newState.description ?? "",
      spaceId: pendingChange.newState.spaceId,
    },
  });

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  async function onSubmit(data: CreateReservationFormInputs) {
    await createReservation({
      startTime: minutesToTime(data.date, data.startTimeMinutes),
      endTime: minutesToTime(data.date, data.endTimeMinutes),
      description: data.title,
      spaceId: data.spaceId,
    });

    cancelChange();

    toast({
      title: "Reservation created",
      description: "The reservation has been created",
    });
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
          <Button onClick={cancelChange} ariaLabel="Cancel" variant="secondary" size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            icon={
              isSubmitting ? (
                <BiLoaderCircle className="animate-spin" />
              ) : <ArrowRightCircleIcon className="w-6 h-6" />
            }
            ariaLabel="Confirm"
            variant="primary"
            size="lg"
          >
            Create Booking
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormField label="Date" required>
          <Controller
            name="date"
            control={control}
            render={({ field: { onChange, value } }) => (
              <input
                type="date"
                onChange={(e) => {
                  const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
                  const newStart = new Date(date.setHours(startTimeMinutes / 60, startTimeMinutes % 60, 0, 0));
                  const newEnd = new Date(date.setHours(endTimeMinutes / 60, endTimeMinutes % 60, 0, 0));

                  setPendingChange({
                    ...pendingChange,
                    newState: {
                      ...pendingChange.newState,
                      startTime: newStart,
                      endTime: newEnd,
                    },
                  });

                  onChange(date);
                }}
                value={value.toISOString().split('T')[0]}
                className="px-2 py-1 border border-gray-300 rounded-md"
              />
            )}
          />
        </FormField>

        <FormField label="Time" required>
          <div className="flex flex-wrap flex-row justify-evenly gap-4">
            <div className="flex-1">
              <Controller
                name={`startTimeMinutes`}
                control={control}
                render={({ field: { onChange, value } }) => {
                  return (
                    <Select
                      options={timeLabelsLong15Minutes
                        .slice(0, endTimeMinutes / 15)
                        .map((time, index) => ({
                          label: time,
                          value: String(index * 15),
                        }))}
                      onChange={(value) => onChange(Number(value.value))}
                      value={{
                        label: `Starting at ${timeLabelsLong15Minutes[value / 15]}`,
                        value: String(value),
                      }}
                    />
                  );
                }}
              />
            </div>

            <div className="flex-1">
              <Controller
                name={`endTimeMinutes`}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={timeLabelsLong15Minutes
                      .slice(startTimeMinutes / 15)
                      .map((time, index) => ({
                        label: time,
                        value: String(startTimeMinutes + index * 15),
                      }))}
                    onChange={(value) => onChange(Number(value.value))}
                    value={{
                      label: `Ending at ${timeLabelsLong15Minutes[value / 15]}`,
                      value: String(value),
                    }}
                  />
                )}
              />
            </div>
          </div>
        </FormField>

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
    </Modal>
  );
};

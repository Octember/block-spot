import { Controller, useForm } from 'react-hook-form';
import { Button } from "../../../client/components/button";
import { FormField } from '../../../client/components/form/form-field';
import { Modal } from "../../../client/components/modal";
import {
  usePendingChanges
} from "../providers/pending-changes-provider";

import { Select } from '../../../client/components/form/select';
import { timeLabelsLong15Minutes } from '../constants';

type CreateReservationFormInputs = {
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  title: string;
}

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

export const CreateReservationModal = () => {
  const { pendingChange, cancelChange, applyChange } = usePendingChanges();

  if (!pendingChange) return null;

  const {
    register,
    handleSubmit,
    reset, control,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: pendingChange.newState.startTime,
      startTimeMinutes: timeToMinutes(pendingChange.newState.startTime),
      endTimeMinutes: timeToMinutes(pendingChange.newState.endTime),
      title: pendingChange.newState.description ?? "",
    },
  });

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  console.log(watch())

  function onSubmit(data: CreateReservationFormInputs) {
    console.log("submitted", data);
  }

  return (
    <>
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
            >
              Cancel
            </Button>
            <Button onClick={applyChange} ariaLabel="Confirm" variant="primary">
              Confirm
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <FormField label="Date" required>
            <input type="date" {...register("date")} />
          </FormField>


          <div className="flex flex-row justify-evenly gap-2">
            <div className='flex-1'>
              <FormField label="Time" required>
                <Controller
                  name={`startTimeMinutes`}
                  control={control}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <Select
                        options={timeLabelsLong15Minutes.slice(0, endTimeMinutes / 15).map((time, index) => ({
                          label: time,
                          value: String(index * 15),
                        }))}
                        onChange={(value) => onChange(Number(value.value))}
                        value={{ label: timeLabelsLong15Minutes[value / 15], value: String(value) }}
                      />
                    );
                  }}
                />
              </FormField>
            </div>

            <div className='flex-1'>
              <FormField label="Time" required>
                <Controller
                  name={`endTimeMinutes`}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      options={timeLabelsLong15Minutes.slice(startTimeMinutes / 15).map((time, index) => ({
                        label: time,
                        value: String(startTimeMinutes + (index * 15)),
                      }))}
                      onChange={(value) => onChange(Number(value.value))}
                      value={{ label: timeLabelsLong15Minutes[value / 15], value: String(value) }}
                    />
                  )}
                />
              </FormField>
            </div>
          </div>
        </form>
      </Modal >

    </>
  );
};

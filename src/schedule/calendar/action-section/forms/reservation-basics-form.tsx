import { Controller, useFormContext } from 'react-hook-form';
import { FC } from 'react';
import { Reservation } from 'wasp/entities';
import { useVenueContext } from '../../providers/venue-provider';
import { DateInput } from '../components/date-input';
import { TimeRangeSelect } from '../components/time-range-select';
import { CreateReservationFormInputs } from '../modals/types';
import { FormField } from '../../../../client/components/form/form-field';
import { Select } from '../../../../client/components/form/select';
import { TextInput } from '../../../../client/components/form/text-input';

// Can be reused by update form
export const ReservationFormBase: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { control, register, watch } = useFormContext<CreateReservationFormInputs>();
  const { venue, getSpaceById } = useVenueContext();

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  return <div className="flex flex-col gap-4">
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
}
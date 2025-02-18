import { parse } from "date-fns";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Reservation } from "wasp/entities";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useVenueContext } from "../../providers/venue-provider";
import { CreateReservationFormInputs } from "../modals/types";

type DateInputProps = {
  startTimeMinutes: number;
  endTimeMinutes: number;
  reservation: Reservation;
};

export const DateInput: FC<DateInputProps> = ({
  startTimeMinutes,
  endTimeMinutes,
  reservation,
}) => {
  const { setPendingChange } = usePendingChanges();
  const { selectedDate } = useVenueContext();
  const { control } = useFormContext<CreateReservationFormInputs>();

  return (
    <Controller
      name="date"
      control={control}
      render={({ field: { onChange, value } }) => {
        const dateValue = value instanceof Date ? value : new Date(value);
        return (
          <input
            type="date"
            onChange={(e) => {
              const date = parse(e.target.value, "yyyy-MM-dd", selectedDate);
              const newStart = new Date(
                date.setHours(startTimeMinutes / 60, startTimeMinutes % 60, 0, 0)
              );
              const newEnd = new Date(
                date.setHours(endTimeMinutes / 60, endTimeMinutes % 60, 0, 0)
              );

              setPendingChange({
                type: "CREATE",
                newState: {
                  ...reservation,
                  startTime: newStart,
                  endTime: newEnd,
                },
              });

              onChange(date);
            }}
            value={dateValue.toISOString().split("T")[0]}
            className="px-2 py-1 border border-gray-300 rounded-md"
          />
        );
      }}
    />
  );
};

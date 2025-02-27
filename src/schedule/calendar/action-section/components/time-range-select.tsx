import { Controller, useFormContext } from "react-hook-form";
import { Select } from "../../../../client/components/form/select";
import { useTimeLabelsLong15Minutes } from "../../constants";
import { FormField } from "../../../../client/components/form/form-field";

export const TimeRangeSelect = () => {
  const { control, watch } = useFormContext();
  const timeLabelsLong15Minutes = useTimeLabelsLong15Minutes();

  const startTimeMinutes = watch("startTimeMinutes");
  const endTimeMinutes = watch("endTimeMinutes");

  return (
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
                  .slice(startTimeMinutes / 15 + 1)
                  .map((time, index) => ({
                    label: time,
                    value: String(startTimeMinutes + (index + 1) * 15),
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
  );
};

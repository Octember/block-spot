import { useFieldArray, Control, Controller } from 'react-hook-form';
import { AvailabilityRule, Space, Venue } from "wasp/entities";
import { FormField } from "../../../client/components/form/form-field";
import { MultiSelect, Select } from "../../../client/components/form/select";
import { timeLabels } from "../../calendar/constants";
import { UpdateVenueFormInputs } from "./types";
import { Button } from "../../../client/components/button";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export const AvailabilityRuleForm = ({
  venue,
  control,
}: {
  venue: Venue & { availabilityRules: AvailabilityRule[] } & { spaces: Space[] };
  control: Control<UpdateVenueFormInputs>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "availabilityRules",
  });

  console.log("avail rules: ", fields);

  return (
    <div className="flex flex-col gap-2">
      <FormField
        label="Availability"
        description="Set the hours when your venue is open for bookings"
      >
        <div className="flex flex-col gap-4">
          {fields.map((rule, index) => (
            <AvailabilityRuleBlock
              key={rule.id}
              venue={venue}
              control={control}
              index={index}
              rule={rule}
              remove={() => remove(index)}
            />
          ))}

          <div className="flex">
            <Button
              onClick={() =>
                append({ days: [], startTimeMinutes: 0, endTimeMinutes: 0, spaceIds: [] })
              }
              variant="secondary"
              icon={<PlusIcon className="size-4" />}
              ariaLabel="Add Availability Rule"
            >
              Add Availability Rule
            </Button>
          </div>
        </div>
      </FormField>
    </div>
  );
};

export const AvailabilityRuleBlock = ({
  venue,
  control,
  index,
  rule,
  remove,
}: {
  venue: Venue & { availabilityRules: AvailabilityRule[] } & { spaces: Space[] };
  control: Control<UpdateVenueFormInputs>;
  index: number;
  rule: {
    spaceIds: string[];
    days: string[];
    startTimeMinutes: number;
    endTimeMinutes: number;
  }
  remove: () => void;
}) => {

  return <div className="flex flex-row justify-between gap-2 items-center bg-gray-200 border border-gray-300 p-4 rounded-md">

    <div className="flex flex-row gap-1.5 items-center">
      {/* <Controller
        name={`availabilityRules.${index}.spaceIds`}
        control={control}
        render={({ field: { onChange, value } }) => (
          <MultiSelect
            disabled
            options={venue.spaces.map((space) => ({
              label: space.name,
              value: space.id,
            }))}
            value={[]}
            onChange={(value) => onChange(value.map((v) => v.value))}
            placeholder="All spaces"
          />
        )}
      /> */}

      <div className="text-sm">
        Spaces are available from
      </div>

      <Controller
        name={`availabilityRules.${index}.startTimeMinutes`}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Select
            size='sm'
            options={Array.from({ length: 24 }, (_, i) => ({
              label: timeLabels[i],
              value: String(i),
            }))}
            onChange={(value) => onChange(Number(value.value))}
            value={{ label: timeLabels[value / 60], value: String(value) }}
          />
        )}
      />

      <div className="text-sm">
        to
      </div>

      <Controller
        name={`availabilityRules.${index}.endTimeMinutes`}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Select
            size='sm'
            options={Array.from({ length: 24 }, (_, i) => ({
              label: timeLabels[i],
              value: String(i),
            }))}
            onChange={(value) => onChange(Number(value.value))}
            value={{ label: timeLabels[value / 60], value: String(value) }}
          />
        )}
      />

      <div className="text-sm">
        on
      </div>

      <Controller
        name={`availabilityRules.${index}.days`}
        control={control}
        render={({ field: { onChange, value } }) => (
          <MultiSelect
            options={Days.map((day) => ({
              label: day.label,
              value: day.value,
            }))}
            value={value.map((day) => ({
              label: day,
              value: day,
            }))}
            onChange={(value) => onChange(value.map((v) => v.value))}
            placeholder="every day"
          />
        )}
      />
    </div>

    <Button
      onClick={() => remove()}
      variant="warning"
      icon={<TrashIcon className="size-4" />}
      ariaLabel="Remove Availability Rule"
    />
  </div>
};


const Days = [
  { label: "Monday", value: "Mon" },
  { label: "Tuesday", value: "Tue" },
  { label: "Wednesday", value: "Wed" },
  { label: "Thursday", value: "Thu" },
  { label: "Friday", value: "Fri" },
  { label: "Saturday", value: "Sat" },
  { label: "Sunday", value: "Sun" },
];

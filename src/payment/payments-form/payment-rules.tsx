import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC } from "react";
import { Control, Controller, useFieldArray, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { getVenueById, useQuery } from "wasp/client/operations";
import { PaymentRule } from "wasp/entities";
import { Button } from "../../client/components/button";
import { Card } from "../../client/components/card";
import { Select } from "../../client/components/form/select";
import { useToast } from "../../client/toast";
import { defaultPaymentRule, RULE_TYPES } from './constants';



type PaymentRuleForm = {
  paymentRules: PaymentRule[];
};

export const PaymentRules = () => {
  const toast = useToast();
  const { venueId } = useParams<{ venueId: string }>();

  const { data: venue, isLoading } = useQuery(getVenueById, {
    venueId: venueId!,
  });

  const { control } = useForm<PaymentRuleForm>({
    defaultValues: {
      paymentRules: venue?.paymentRules || [defaultPaymentRule(venueId!)],
    },
  });

  const {
    fields: paymentRules,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "paymentRules",
  });

  if (isLoading || !venue) {
    return <div>Loading...</div>;
  }

  return (
    <Card
      heading={{
        title: "Payment rules",
        description: "Manage your venue'spayment rules",
      }}
    >
      <div className="flex flex-col gap-4 -mx-4">
        {paymentRules.map((rule, index) => (
          <div key={rule.id} className="flex flex-row gap-2 items-center">
            <div className="text-sm text-gray-500">{index + 1}</div>
            <PaymentRuleComponent
              paymentRule={rule}
              control={control}
              index={index}
              venue={venue}
            />
            <Button
              variant="tertiary"
              icon={<XMarkIcon className="w-4 h-4" />}
              onClick={() => remove(index)}
              ariaLabel="Remove rule"
            />
          </div>
        ))}

        <div>
          <Button
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={() => append(defaultPaymentRule(venueId!))}
            ariaLabel="Add rule"
          >
            Add rule
          </Button>
        </div>
      </div>
    </Card>
  );
};

const PaymentRuleComponent: FC<{
  paymentRule: PaymentRule;
  control: Control<PaymentRuleForm>;
  index: number;
  venue: NonNullable<Awaited<ReturnType<typeof getVenueById>>>;
}> = ({ paymentRule, control, index, venue }) => {
  return (
    <div className="flex-1 flex flex-col gap-2 p-4 border border-gray-200 rounded-md">
      <div className="flex flex-row gap-2 items-center text-md">
        <div >At all times:</div>
        <div>all spaces are priced at</div>

        <Controller
          control={control}
          name={`paymentRules.${index}.pricePerPeriod`}
          render={({ field: { value, onChange } }) => (
            <button
              className="text-md text-teal-600 font-bold"
              onClick={() => onChange(value)}
            >
              ${value?.toString()}
            </button>
          )}
        />

        <Controller
          control={control}
          name={`paymentRules.${index}.ruleType`}
          render={({ field: { value, onChange } }) => (
            <Select
              options={RULE_TYPES}
              value={RULE_TYPES.find(ruleType => ruleType.value === value) || RULE_TYPES[0]}
              onChange={option => onChange(option.value)}
              size="sm"
            />
          )}
        />

        {paymentRule.ruleType === "FLAT_FEE" && (
          <div>
            <span>for a booking if:</span>
          </div>
        )}


      </div>
    </div>
  );
};

// const DollarInput: FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {

//   return <div className="relative">
//     <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
//     <TextInput
//       type="number"
//       step="0.01"
//       min="0"
//       value={value}
//       onChange={(e) => onChange(Number(e.target.value))}
//       placeholder="0.00"
//       className="pl-6 border p-2 rounded w-full"
//     />
//   </div>
// };

{
  /* <Controller
          control={control}
          name={`paymentRules.${index}.spaceIds`}
          render={({ field: { value, onChange } }) => (
            <MultiSelect
              options={venue.spaces.map((space) => ({
                label: space.name,
                value: space.id,
              }))}
              value={
                value.length === 0
                  ? venue.spaces.map((space) => ({
                    label: "All Spaces",
                    value: "",
                  }))
                  : value.map((id) => ({
                    label: venue.spaces.find((space) => space.id === id)?.name || "",
                    value: id,
                  }))
              }
              onChange={value => onChange([...new Set(value.map(v => v.value))])}
            />
          )} */
}
{
  /* /> */
}

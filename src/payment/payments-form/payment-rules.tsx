import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FC, useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext
} from "react-hook-form";
import { BiLoaderCircle } from "react-icons/bi";
import { useParams } from "react-router-dom";
import { getVenuePaymentRules, updatePaymentRules, useQuery } from "wasp/client/operations";
import { PaymentRule } from "wasp/entities";
import { Button } from "../../client/components/button";
import { Card } from "../../client/components/card";
import { Select } from "../../client/components/form/select";
import { TextInput } from "../../client/components/form/text-input";
import { useToast } from "../../client/toast";
import {
  defaultPaymentRule,
  DURATION_FILTER_OPTIONS,
  PeriodOptions,
  RULE_TYPES,
} from "./constants";

type PaymentRuleForm = {
  paymentRules: PaymentRule[];
};

export const PaymentRules = () => {
  const toast = useToast();
  const { venueId } = useParams<{ venueId: string }>();

  const form = useForm<PaymentRuleForm>({
    defaultValues: {
      paymentRules: [defaultPaymentRule(venueId!)],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = form;

  const { data: paymentRules, isLoading } = useQuery(getVenuePaymentRules, {
    venueId: venueId!,
  }, {
    onSuccess: (data) => {
      form.reset({
        paymentRules: data,
      });
    }
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "paymentRules",
  });

  if (isLoading || !paymentRules) {
    return <div>Loading...</div>;
  }

  async function onSubmit(data: PaymentRuleForm) {
    try {
      await updatePaymentRules({
        venueId: venueId!,
        // @ts-expect-error ????
        rules: data.paymentRules.map((rule) => ({
          ...rule,
          periodMinutes: rule.periodMinutes || 0,
          pricePerPeriod: rule.pricePerPeriod?.toString() || 0,
          multiplier: rule.multiplier?.toString() || 0,
          discountRate: rule.discountRate?.toString() || 0,
          startTime: rule.startTime || undefined,
          endTime: rule.endTime || undefined,
          daysOfWeek: rule.daysOfWeek || [],
          requiredTags: rule.requiredTags || [],
          minMinutes: rule.minMinutes || 0,
          maxMinutes: rule.maxMinutes || 0,
        })),
      });
      toast({
        title: "Payment rules updated",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to update payment rules",
        description: error?.message,
        type: "error",
      });
    }
  }

  return (
    <Card
      heading={{
        title: "Payment rules",
        description: "Manage your venue's payment rules",
      }}
    >
      <FormProvider {...form}>
        <form className="flex flex-col gap-4 -mx-4">
          {fields.map((rule, index) => (
            <div key={index} className="flex flex-row gap-2 items-center">
              <div className="text-sm text-gray-500">{index + 1}</div>
              <PaymentRuleComponent
                index={index}
              />
              <Button
                variant="tertiary"
                icon={<XMarkIcon className="w-4 h-4" />}
                onClick={() => remove(index)}
                ariaLabel="Remove rule"
              />

              <div>
                {JSON.stringify(rule, null, 2)}
              </div>
            </div>
          ))}

          <div>
            <Button
              variant="secondary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => append(defaultPaymentRule(venueId!, fields.length))}
              ariaLabel="Add rule"
            >
              Add rule
            </Button>
          </div>

          <div>
            <Button
              disabled={!isDirty}
              type="submit"
              ariaLabel="Save payment rules"
              onClick={handleSubmit(onSubmit)}
              icon={isSubmitting ? <BiLoaderCircle className="w-4 h-4 animate-spin" /> : undefined}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
};

const PaymentRuleComponent: FC<{
  index: number;
}> = ({ index }) => {

  const { control, setValue, getValues } = useFormContext();

  // TODO we shouldnt store any state like this, needs to be loaded from API
  const [durationFilter, setDurationFilter] = useState<
    "minMinutes" | "maxMinutes"
  >("minMinutes");


  useEffect(() => {
    const oldDurationFilter = durationFilter === "minMinutes" ? "maxMinutes" : "minMinutes";
    const oldValue = getValues(`paymentRules.${index}.${oldDurationFilter}`);

    setValue(`paymentRules.${index}.${oldDurationFilter}`, null, {
      shouldDirty: true,
    });

    setValue(`paymentRules.${index}.${durationFilter}`, oldValue, {
      shouldDirty: true,
    });
  }, [durationFilter]);


  return (
    <div className="flex-1 flex flex-col gap-2 p-4 border border-gray-200 rounded-md">
      <div className="flex flex-row gap-2 items-center text-md">
        <div>At all times:</div>
        <div>all spaces are priced at</div>
        <Controller
          control={control}
          name={`paymentRules.${index}.pricePerPeriod`}
          render={({ field: { value, onChange } }) => (
            <TextInput
              type="number"
              value={value?.toString()}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        />

        <Controller
          control={control}
          name={`paymentRules.${index}.ruleType`}
          render={({ field: { value, onChange } }) => (
            <>
              <Select
                options={RULE_TYPES}
                value={
                  RULE_TYPES.find((ruleType) => ruleType.value === value) ||
                  RULE_TYPES[0]
                }
                onChange={(option) => {
                  onChange(option.value);
                }}
                size="sm"
              />

              {value === "BASE_RATE" && (
                <>
                  <span>of</span>
                  <Controller
                    control={control}
                    name={`paymentRules.${index}.periodMinutes`}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        options={PeriodOptions}
                        value={
                          PeriodOptions.find((option) => option.value === value) ||
                          PeriodOptions[0]
                        }
                        onChange={(option) => onChange(option.value)}
                      />
                    )}
                  />
                </>
              )}
            </>
          )}
        />

        <span>for a booking if:</span>
      </div>

      <div className="flex flex-row gap-2 items-center text-md">
        <span>The booking&apos;s duration is</span>

        <Select
          options={DURATION_FILTER_OPTIONS}
          value={
            durationFilter
              ? DURATION_FILTER_OPTIONS.find(
                (option) => option.value === durationFilter,
              )!
              : DURATION_FILTER_OPTIONS[0]
          }
          onChange={(option) => {
            const newDurationFilter = option.value as
              | "minMinutes"
              | "maxMinutes";
            setDurationFilter(newDurationFilter);

            // console.log(newDurationFilter, paymentRule[oldDurationFilter]);


            // setValue(`paymentRules.${index}`,
            //   {
            //     ...paymentRule,
            //     [newDurationFilter]: paymentRule[oldDurationFilter],
            //     [oldDurationFilter]: null,
            //   }, {
            //   shouldDirty: true,
            // });
          }}
        />


        {durationFilter === "minMinutes" && (
          <Controller
            control={control}
            name={`paymentRules.${index}.minMinutes`}
            render={({ field: { value, onChange } }) => (
              <Select
                options={PeriodOptions}
                value={
                  PeriodOptions.find((option) => option.value === value) ||
                  PeriodOptions[0]
                }
                onChange={(option) => onChange(option.value)}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name={`paymentRules.${index}.maxMinutes`}
          render={({ field: { value, onChange } }) => (
            <Select
              options={PeriodOptions}
              value={
                PeriodOptions.find((option) => option.value === value) ||
                PeriodOptions[0]
              }
              onChange={(option) => onChange(option.value)}
            />
          )}
        />
      </div>

    </div >
  );
};

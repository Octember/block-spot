import {
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FC, useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  getOrganizationTags,
  getVenuePaymentRules,
  updatePaymentRules,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../../client/components/button";
import { Card } from "../../client/components/card";
import { MultiSelect, Select } from "../../client/components/form/select";
import { TextInput } from "../../client/components/form/text-input";
import { useToast } from "../../client/toast";
import { ManageTagsButton } from "../../team/manage-tags-button";
import {
  CONDITION_FILTER_OPTIONS,
  defaultPaymentRule,
  DURATION_FILTER_OPTIONS,
  PeriodOptions,
  RULE_TYPES,
  toApiInput,
  toFormInput,
} from "./constants";
import { PaymentRoleFormInput } from "./types";
import { LuPencil } from "react-icons/lu";

type PaymentRuleForm = {
  paymentRules: PaymentRoleFormInput[];
};

export const PaymentRules = () => {
  const toast = useToast();
  const { venueId } = useParams<{ venueId: string }>();

  const form = useForm<PaymentRuleForm>({
    defaultValues: {
      paymentRules: [],
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
  } = form;

  const { data: paymentRules, isLoading } = useQuery(getVenuePaymentRules, {
    venueId: venueId!,
  });

  useEffect(() => {
    if (paymentRules) {
      form.reset({
        paymentRules: paymentRules.map(toFormInput),
      });
    }
  }, [paymentRules]);

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "paymentRules",
  });

  async function onSubmit(data: PaymentRuleForm) {
    try {
      await updatePaymentRules({
        venueId: venueId!,
        rules: data.paymentRules.map(toApiInput),
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
        description:
          "Manage your venue's payment rules. Rules are applied in order of priority, from highest to lowest.",
      }}
      isLoading={isLoading}
    >
      <FormProvider {...form}>
        <form className="flex flex-col gap-4 -mx-4">
          {fields.map((rule, ruleIndex) => (
            <div key={ruleIndex} className="flex flex-row gap-2 items-center">
              <div className="text-sm text-gray-500">
                {(rule.priority || 0) + 1}
              </div>
              <PaymentRuleComponent ruleIndex={ruleIndex} />
              <Button
                variant="tertiary"
                icon={<XMarkIcon className="w-4 h-4" />}
                onClick={() => remove(ruleIndex)}
                ariaLabel="Remove rule"
              />
            </div>
          ))}

          <div className="ml-4 flex flex-col gap-4 items-start">
            <Button
              variant="secondary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() => append(defaultPaymentRule(fields.length))}
              ariaLabel="Add rule"
            >
              Add rule
            </Button>

            <Button
              disabled={!isDirty}
              type="submit"
              ariaLabel="Save payment rules"
              onClick={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
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
  ruleIndex: number;
}> = ({ ruleIndex }) => {
  const { data: tags } = useQuery(getOrganizationTags);
  const { control } = useFormContext<PaymentRuleForm>();
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: `paymentRules.${ruleIndex}.conditions`,
  });

  const tagOptions = useMemo(
    () => tags?.map((tag) => ({ label: tag.name, value: tag.id })) || [],
    [tags],
  );

  return (
    <div className="flex-1 flex flex-col gap-2 p-4 border border-gray-200 rounded-md">
      <div className="flex flex-row gap-2 items-center text-md">
        <div>At all times:</div>
        <div>all spaces are priced at</div>
        <Controller
          control={control}
          name={`paymentRules.${ruleIndex}.pricePerPeriod`}
          render={({ field: { value, onChange } }) =>
            isEditingPrice ? (
              <div className="flex flex-row gap-2 items-center">
                $
                <TextInput
                  className="max-w-20"
                  type="number"
                  value={value?.toString()}
                  onChange={(e) => onChange(e.target.value)}
                />
                <button onClick={() => setIsEditingPrice(false)}>
                  <CheckCircleIcon className="size-6 text-teal-700" />
                </button>
              </div>
            ) : (
              <button
                className="flex flex-row gap-2 items-center"
                onClick={() => setIsEditingPrice(true)}
              >
                <span className="font-bold text-teal-700">
                  ${value?.toString()}
                </span>
                <LuPencil className="size-4 text-teal-700" />
              </button>
            )
          }
        />

        <Controller
          control={control}
          name={`paymentRules.${ruleIndex}.ruleType`}
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
                    name={`paymentRules.${ruleIndex}.periodMinutes`}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        options={PeriodOptions}
                        value={
                          PeriodOptions.find(
                            (option) => option.value === value,
                          ) || PeriodOptions[0]
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
        <span>for a booking</span>
      </div>

      <div className="flex flex-col gap-2 text-md">
        {fields.map((condition, conditionIndex) => (
          <Controller
            key={conditionIndex}
            control={control}
            name={`paymentRules.${ruleIndex}.conditions.${conditionIndex}`}
            render={({ field: { value, onChange } }) => {
              return (
                <div className="flex flex-row gap-2 items-center">
                  <span className="font-bold">If:</span>

                  <Select
                    options={CONDITION_FILTER_OPTIONS}
                    value={
                      CONDITION_FILTER_OPTIONS.find(
                        (option) => option.value === value.type,
                      ) || CONDITION_FILTER_OPTIONS[0]
                    }
                    onChange={(option) => {
                      if (option.value === "duration") {
                        onChange({
                          type: "duration",
                          durationFilter: "startTime",
                          durationValue: 60,
                        });
                      } else {
                        onChange({
                          type: "userTags",
                          userTags: [],
                        });
                      }
                    }}
                  />

                  {value.type === "duration" && (
                    <>
                      <Select
                        options={DURATION_FILTER_OPTIONS}
                        value={
                          DURATION_FILTER_OPTIONS.find(
                            (option) => option.value === value.durationFilter,
                          ) || DURATION_FILTER_OPTIONS[0]
                        }
                        onChange={(option) => {
                          onChange({
                            ...value,
                            durationFilter: option.value,
                          });
                        }}
                      />

                      <Select
                        options={PeriodOptions}
                        value={
                          PeriodOptions.find(
                            (option) => option.value === value.durationValue,
                          ) || PeriodOptions[0]
                        }
                        onChange={(option) =>
                          onChange({
                            ...value,
                            durationValue: option.value,
                          })
                        }
                      />
                    </>
                  )}

                  {value.type === "userTags" && (
                    <>
                      <Controller
                        control={control}
                        name={`paymentRules.${ruleIndex}.conditions.${conditionIndex}.userTags`}
                        render={({
                          field: { value: selectedTags, onChange },
                        }) => (
                          <MultiSelect
                            options={tagOptions}
                            value={tagOptions.filter((tag) =>
                              selectedTags.some(
                                (selectedTag) => tag.value === selectedTag,
                              ),
                            )}
                            onChange={(tags) =>
                              onChange(tags.map((tag) => tag.value))
                            }
                          />
                        )}
                      />

                      <ManageTagsButton />
                    </>
                  )}

                  <button onClick={() => remove(conditionIndex)}>
                    <XMarkIcon className="w-4 h-4" />
                  </button>

                  {/* {JSON.stringify(value)} */}
                </div>
              );
            }}
          />
        ))}

        {fields.length < 1 && (
          <div>
            <Button
              variant="secondary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={() =>
                append({
                  type: "duration",
                  durationFilter: "startTime",
                  durationValue: 60,
                })
              }
              ariaLabel="Add condition"
            >
              Add condition
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import { ArrowRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import {
  SubmitHandler,
  useFieldArray,
  useForm,
  Controller,
} from "react-hook-form";
import { BiLoaderCircle } from "react-icons/bi";
import { createVenue, updateVenue } from "wasp/client/operations";
import { Button } from "../../client/components/button";
import { FormField } from "../../client/components/form/form-field";
import { TextInput } from "../../client/components/form/text-input";
import { useToast } from "../../client/toast";
import { PricingStep } from "./pricing-step";
import { Select } from "../../client/components/form/select";
import { TimeZoneOptions } from "./constants";
import { useAuth } from "wasp/client/auth";

interface FormData {
  organizationName: string;
  organizationType: string;
  teamSize: string;
}

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export function OrganizationStep({
  formData,
  setFormData,
  onNext,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onNext: () => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label
            htmlFor="organizationName"
            className="block text-sm font-medium text-gray-700"
          >
            Organization Name
          </label>
          <input
            type="text"
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) =>
              setFormData({ ...formData, organizationName: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="organizationType"
            className="block text-sm font-medium text-gray-700"
          >
            Organization Type
          </label>
          <select
            id="organizationType"
            value={formData.organizationType}
            onChange={(e) =>
              setFormData({ ...formData, organizationType: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Select type...</option>
            <option value="business">Business</option>
            <option value="nonprofit">Non-profit</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="teamSize"
            className="block text-sm font-medium text-gray-700"
          >
            Team Size
          </label>
          <select
            id="teamSize"
            value={formData.teamSize}
            onChange={(e) =>
              setFormData({ ...formData, teamSize: e.target.value })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
          >
            <option value="">Select size...</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201+">201+</option>
          </select>
        </div>
      </div>

      <Button
        onClick={() => {
          setLoading(true);
          onNext();
        }}
        icon={
          loading ? (
            <BiLoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="size-4" />
          )
        }
        disabled={
          !formData.organizationName ||
          !formData.organizationType ||
          !formData.teamSize ||
          loading
        }
        ariaLabel="Continue"
      >
        Continue
      </Button>
    </div>
  );
}

type SpacesStepFormData = {
  spaces: { name: string; type: string; capacity: number }[];
  contactEmail: string;
  timeZoneId: string;
};

export function SpacesStep({
  organizationName,
  onNext,
}: {
  organizationName: string;
  onNext: () => Promise<void>;
}) {
  const { data: user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SpacesStepFormData>({
    defaultValues: {
      spaces: [{ name: "", type: "Conference Room", capacity: 1 }],
      contactEmail: user?.email || "",
      timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const {
    fields: spaces,
    append,
    remove,
  } = useFieldArray({
    control: control,
    name: "spaces",
  });

  const handleCreateVenueAndSpaces: SubmitHandler<SpacesStepFormData> = async (
    formData,
  ) => {
    setIsCreating(true);
    try {
      const venue = await createVenue({
        name: organizationName,
      });

      await updateVenue({
        id: venue.id,
        name: venue.name,
        displayStart: 480,
        displayEnd: 1080,
        timeZoneId: formData.timeZoneId,
        spaces: formData.spaces.map((space) => ({
          name: space.name,
          id: "",
        })),
        announcements: "",
        contactEmail: formData.contactEmail,
      });

      await onNext();
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      toast({
        type: "error",
        title: "Failed to create venue",
        description: err.message || "Please try again",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(handleCreateVenueAndSpaces)}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold pb-2">Venue Details</h2>
        <FormField
          label="Contact Email"
          description="The email address that customers will use to contact you"
        >
          <TextInput
            type="email"
            placeholder="Contact Email"
            required
            {...register("contactEmail", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />

          {errors.contactEmail && (
            <p className="text-red-500">{errors.contactEmail.message}</p>
          )}
        </FormField>

        <FormField
          label="Time Zone"
          description="The time zone for your venue"
        >
          <Controller
            control={control}
            name="timeZoneId"
            render={({ field: { value, onChange } }) => (
              <Select
                options={TimeZoneOptions}
                value={
                  TimeZoneOptions.find((tz) => tz.value === value) || {
                    value: "America/New_York",
                    label: "America/New_York",
                  }
                }
                onChange={(value) => onChange(value.value)}
              />
            )}
          />
        </FormField>
      </div>

      <div className="prose">
        <h2>Setup Spaces</h2>
        <p>
          Create your first venue and define the spaces within it. You can
          always add more spaces later.
        </p>
      </div>

      <div className="space-y-4">
        {spaces.map((space, index) => (
          <div key={index} className="flex gap-4 items-start">
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Space Name
                </label>
                <input
                  type="text"
                  {...register(`spaces.${index}.name`, {
                    required: "Space name is required",
                  })}
                  placeholder="e.g., Main Conference Room"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />

                {errors.spaces?.[index]?.name && (
                  <p className="text-red-500">
                    {errors.spaces[index].name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    {...register(`spaces.${index}.type`)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="Conference Room">Conference Room</option>
                    <option value="Desk">Desk</option>
                    <option value="Office">Office</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Event Space">Event Space</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register(`spaces.${index}.capacity`)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {spaces.length > 1 && (
              <button
                onClick={() => remove(index)}
                className="mt-8 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button
          icon={
            isCreating ? (
              <BiLoaderCircle className="size-4 animate-spin" />
            ) : (
              <PlusIcon className="size-4" />
            )
          }
          onClick={() =>
            append({ name: "", type: "Conference Room", capacity: 1 })
          }
          variant="secondary"
          ariaLabel="Add Another Space"
          disabled={isCreating}
        >
          Add Another Space
        </Button>

        <Button
          icon={
            isCreating ? (
              <BiLoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRightIcon className="size-4" />
            )
          }
          type="submit"
          disabled={isCreating}
          ariaLabel="Continue"
        >
          {isCreating ? "Creating..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}

export function InviteStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="prose">
        <h2>Invite Your Team</h2>
        <p>
          Block Spot works best with your whole team. Invite them now, or do it
          later from your organization settings.
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={onNext} variant="secondary" ariaLabel="Skip for now">
          Skip for now
        </Button>
        <Button onClick={onNext} ariaLabel="Invite Team" disabled>
          Invite Team
        </Button>
      </div>
    </div>
  );
}

export function CompleteStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="prose">
        <h2>You&apos;re All Set!</h2>
        <p>
          Your organization is ready to go. You can now start managing your
          schedule and collaborating with your team.
        </p>
      </div>
      <Button onClick={onNext} ariaLabel="Get Started">
        Get Started
      </Button>
    </div>
  );
}

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="prose">
        <p>
          We&apos;re excited to help your team manage your schedule more
          effectively. Let&apos;s get your organization set up in just a few
          steps.
        </p>
      </div>
      <Button
        onClick={onNext}
        ariaLabel="Get Started"
        icon={<ArrowRightIcon className="size-4" />}
      >
        Get Started
      </Button>
    </div>
  );
}

export { PricingStep };

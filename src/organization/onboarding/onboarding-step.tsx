import { ArrowRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { createVenue, generateCheckoutSession, updateVenue } from "wasp/client/operations";
import { cn } from "../../client/cn";
import { Button } from "../../client/components/button";
import { useToast } from "../../client/toast";
import { PaymentPlanId } from "../../payment/plans";
import { paymentPlanCards } from "../../payment/PricingPage";

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
        onClick={onNext}
        disabled={
          !formData.organizationName ||
          !formData.organizationType ||
          !formData.teamSize
        }
        ariaLabel="Continue"
      >
        Continue
      </Button>
    </div>
  );
}

export function SpacesStep({
  organizationName,
  onNext,
}: {
  organizationName: string;
  onNext: () => Promise<void>;
}) {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [spaces, setSpaces] = useState<
    { name: string; type: string; capacity: number }[]
  >([{ name: "", type: "Conference Room", capacity: 1 }]);

  const handleAddSpace = () => {
    setSpaces([...spaces, { name: "", type: "Conference Room", capacity: 1 }]);
  };

  const handleRemoveSpace = (index: number) => {
    setSpaces(spaces.filter((_, i) => i !== index));
  };

  const handleSpaceChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newSpaces = [...spaces];
    newSpaces[index] = { ...newSpaces[index], [field]: value };
    setSpaces(newSpaces);
  };

  const handleCreateVenueAndSpaces = async () => {
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
        spaces: spaces.map((space) => ({
          name: space.name,
          id: "",
        })),
        announcements: "",
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

  const isValid = spaces.every(
    (space) =>
      space.name.trim() !== "" &&
      space.type.trim() !== "" &&
      space.capacity > 0,
  );

  return (
    <div className="space-y-6">
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
                  value={space.name}
                  onChange={(e) =>
                    handleSpaceChange(index, "name", e.target.value)
                  }
                  placeholder="e.g., Main Conference Room"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={space.type}
                    onChange={(e) =>
                      handleSpaceChange(index, "type", e.target.value)
                    }
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
                    value={space.capacity}
                    onChange={(e) =>
                      handleSpaceChange(
                        index,
                        "capacity",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {spaces.length > 1 && (
              <button
                onClick={() => handleRemoveSpace(index)}
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
          onClick={handleAddSpace}
          variant="secondary"
          ariaLabel="Add Another Space"
          icon={<PlusIcon className="size-4" />}
        >
          Add Another Space
        </Button>

        <Button
          onClick={handleCreateVenueAndSpaces}
          disabled={!isValid || isCreating}
          ariaLabel="Continue"
        >
          {isCreating ? "Creating..." : "Continue"}
        </Button>
      </div>
    </div>
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
          We&apos;re excited to help your team manage your schedule more effectively.
          Let&apos;s get your organization set up in just a few steps.
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

export function PricingStep({
  onNext,
  organizationId
}: {
  onNext: () => void;
  organizationId: string;
}) {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const toast = useToast();
  const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.Business;

  async function handleSelectPlan(planId: PaymentPlanId) {
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession({
        organizationId,
        planId,
        returnToOnboarding: true,
      });

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error(err);
      toast({
        type: "error",
        title: "Failed to setup payment",
        description: err.message || "Please try again",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  }

  async function handleSelectFreePlan() {
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="prose">
        <p>
          Choose the plan that best fits your needs. All paid plans include a 30-day free trial.
        </p>
      </div>

      <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
        {Object.entries(paymentPlanCards).map(([planId, card]) => (
          <div
            key={planId}
            className={cn(
              "rounded-3xl p-8 xl:p-10 bg-white",
              {
                "ring-2 ring-gray-200 my-4": planId !== bestDealPaymentPlanId,
              },
              { "ring-2 ring-teal-600": planId === bestDealPaymentPlanId },
            )}
          >
            <div className="flex items-center justify-between gap-x-4">
              <h2
                id={`${card.name}-heading`}
                className="text-lg font-semibold leading-8 text-gray-900"
              >
                {card.name}
              </h2>
              {planId === bestDealPaymentPlanId && (
                <p className="rounded-full bg-teal-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-teal-600">
                  Most popular
                </p>
              )}
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {card.description}
            </p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">
                {card.price}
              </span>
              <span className="text-sm font-semibold leading-6 text-gray-600">
                /month
              </span>
            </p>
            <button
              onClick={() => {
                if (planId === PaymentPlanId.Community) {
                  handleSelectFreePlan();
                } else {
                  handleSelectPlan(planId as PaymentPlanId);
                }
              }}
              disabled={isPaymentLoading}
              aria-label={`Select ${card.name} plan`}
              className={cn(
                "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                planId === bestDealPaymentPlanId
                  ? "bg-teal-700 text-white shadow-sm hover:bg-teal-600 focus-visible:outline-teal-600"
                  : "bg-white text-teal-600 ring-1 ring-inset ring-teal-200 hover:ring-teal-300",
              )}
            >
              {isPaymentLoading ? "Loading..." : "Start free trial"}
            </button>
            <ul
              role="list"
              className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
            >
              {card.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <AiFillCheckCircle
                    className="h-6 w-5 flex-none text-teal-600"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

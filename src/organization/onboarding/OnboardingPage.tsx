import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { routes } from "wasp/client/router";
import { useAuth } from "wasp/client/auth";
import type { Organization, OnboardingState } from 'wasp/entities';
import {
  createOrganization,
  createVenue,
  getUserOrganizations,
  updateVenue,
  updateOnboardingState,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../../client/components/button";
import { useToast } from "../../client/toast";
import { ArrowRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";

type OnboardingStep = {
  id: string;
  title: string;
  name: string;
  description?: string;
  next: string | null;
}

const ONBOARDING_STEPS: Record<string, OnboardingStep> = {
  WELCOME: {
    id: "welcome",
    name: "Welcome",
    title: "Welcome to blockspot!",
    next: "organization",
  },
  ORGANIZATION: {
    id: "organization",
    name: "Organization",
    title: "Organization Details",
    description: "Tell us about your organization",
    next: "spaces",
  },
  SPACES: {
    id: "spaces",
    name: "Spaces",
    title: "Setup Spaces",
    description: "Create your first venue and spaces",
    next: "invite",
  },
  INVITE: {
    id: "invite",
    name: "Invite Team",
    title: "Invite Your Team",
    description: "Get your team onboard",
    next: "complete",
  },
  COMPLETE: {
    id: "complete",
    name: "Complete",
    title: "All Set!",
    description: "You're ready to go",
    next: null,
  },
} as const;

type StepId = keyof typeof ONBOARDING_STEPS;

const getOnboardingUpdates = (step: string): Partial<OnboardingState> => {
  const updates: Partial<OnboardingState> = {};
  switch (step) {
    case "organization":
      updates.hasCompletedProfile = true;
      break;
    case "spaces":
      updates.hasAddedPaymentMethod = true;
      break;
    case "invite":
      updates.hasInvitedMembers = true;
      break;
    case "complete":
      updates.hasCompletedOnboarding = true;
      break;
  }
  return updates;
};

const getTargetStep = (onboardingState: OnboardingState | null, organization: OrganizationWithOnboarding | undefined) => {
  if (!onboardingState) return 'welcome';
  if (onboardingState.hasInvitedMembers) return 'complete';
  if (onboardingState.hasAddedPaymentMethod) return 'invite';
  if (onboardingState.hasCompletedProfile) return 'spaces';
  return organization ? 'spaces' : 'welcome';
};

type OrganizationWithOnboarding = Organization & {
  onboardingState: OnboardingState | null;
};

const determineOnboardingStep = (
  currentStep: string,
  organization: OrganizationWithOnboarding | undefined
): { shouldRedirect: boolean; targetStep: string } => {
  if (!organization) {
    return { shouldRedirect: false, targetStep: "welcome" };
  }

  const { onboardingState } = organization;

  if (onboardingState?.hasCompletedOnboarding) {
    return { shouldRedirect: true, targetStep: "/" };
  }

  if ((currentStep === "welcome" || currentStep === "organization") && organization) {
    return { shouldRedirect: true, targetStep: "/onboarding/spaces" };
  }

  const targetStep = getTargetStep(onboardingState, organization);

  const currentStepIndex = Object.values(ONBOARDING_STEPS).findIndex(s => s.id === currentStep);
  const targetStepIndex = Object.values(ONBOARDING_STEPS).findIndex(s => s.id === targetStep);
  const shouldRedirect = currentStepIndex > targetStepIndex;

  return {
    shouldRedirect,
    targetStep: shouldRedirect ? `/onboarding/${targetStep}` : currentStep,
  };
};

export function OrganizationOnboardingPage() {
  const navigate = useNavigate();
  const { data: organizations } = useQuery(getUserOrganizations);
  const { step = "welcome" } = useParams();
  const { data: user, isLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "",
    teamSize: "",
  });

  useEffect(() => {
    if (organizations?.[0]) {
      const { shouldRedirect, targetStep } = determineOnboardingStep(step, organizations[0]);
      if (shouldRedirect) {
        navigate(targetStep);
      }
    }
  }, [organizations, step, navigate]);

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  const currentStep =
    ONBOARDING_STEPS[step.toUpperCase() as StepId] || ONBOARDING_STEPS.WELCOME;

  const updateProgress = async (organizationId: string, step: string) => {
    try {

      const updates = getOnboardingUpdates(step);

      if (Object.keys(updates).length > 0) {
        await updateOnboardingState({
          organizationId,
          updates,
        });
      }
    } catch (error: any) {
      console.error('Failed to update onboarding state:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep.id === "organization") {
      try {
        const org = await createOrganization({
          name: formData.organizationName,
          type: formData.organizationType,
          teamSize: formData.teamSize,
        });
        await updateProgress(org.id, currentStep.id);
      } catch (error: any) {
        toast({
          type: "error",
          title: "Failed to create organization",
          description: error.message || "Please try again",
        });
        return;
      }
    } else if (organizations?.[0]) {
      await updateProgress(organizations[0].id, currentStep.id);
    }

    if (currentStep.next) {
      navigate(`/onboarding/${currentStep.next}`);
    } else {
      navigate(routes.ScheduleRoute.to);
    }
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case "welcome":
        return <WelcomeStep onNext={handleNext} />;
      case "organization":
        return (
          <OrganizationStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        );
      case "spaces":
        return (
          <SpacesStep
            organizationName={formData.organizationName}
            onNext={handleNext}
          />
        );
      case "invite":
        return <InviteStep onNext={handleNext} />;
      case "complete":
        return <CompleteStep onNext={handleNext} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <OnboardingProgress currentStep={currentStep.id} />

        <div className="mt-10 bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold">{currentStep.title}</h1>
          {currentStep.description && <p className="mt-2 text-gray-600">{currentStep.description}</p>}

          <div className="mt-8">{renderStep()}</div>
        </div>
      </div>
    </div>
  );
}

function OnboardingProgress({ currentStep }: { currentStep: string }) {
  const steps = Object.values(ONBOARDING_STEPS);

  return (
    <nav aria-label="Progress" className="w-full px-8">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`relative ${index !== steps.length - 1 ? "pr-24" : ""}`}
          >
            <div className="flex items-center">
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full
                  ${currentStep === step.id
                    ? "border-2 border-indigo-600 bg-white"
                    : Object.values(ONBOARDING_STEPS).findIndex(
                      (s) => s.id === currentStep,
                    ) > index
                      ? "bg-indigo-600"
                      : "border-2 border-gray-300 bg-white"
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${currentStep === step.id ? "bg-indigo-600" : ""}`}
                />
              </div>
              {index !== steps.length - 1 && (
                <div className="absolute left-8 top-4 w-full h-0.5 -translate-y-1/2 bg-gray-300" />
              )}
            </div>
            <span className="absolute -bottom-6 w-max text-sm font-medium text-gray-500">
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="prose">
        <p>
          We're excited to help your team manage your schedule more
          effectively. Let's get your organization set up in just a few steps.
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

function OrganizationStep({
  formData,
  setFormData,
  onNext,
}: {
  formData: any;
  setFormData: (data: any) => void;
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

function SpacesStep({
  organizationName,
  onNext,
}: {
  organizationName: string;
  onNext: () => void;
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
      // First create the venue
      const venue = await createVenue({
        name: organizationName,
      });

      // Then update it with spaces
      await updateVenue({
        id: venue.id,
        name: venue.name,
        displayStart: 480, // 8 AM
        displayEnd: 1080, // 6 PM
        spaces: spaces.map((space) => ({
          name: space.name,
          id: "", // Empty ID for new spaces
        })),
      });

      onNext();
    } catch (error: any) {
      toast({
        type: "error",
        title: "Failed to create venue",
        description: error.message || "Please try again",
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

function InviteStep({ onNext }: { onNext: () => void }) {
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
        <Button onClick={onNext} ariaLabel="Invite Team">
          Invite Team
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="prose">
        <h2>You're All Set!</h2>
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

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import {
  createOrganization,
  getUserOrganization,
  updateOnboardingState,
  useQuery,
} from "wasp/client/operations";
import { routes } from "wasp/client/router";
import type { OnboardingState, Organization } from "wasp/entities";
import { useToast } from "../../client/toast";
import {
  determineOnboardingStep,
  getOnboardingUpdates,
  ONBOARDING_STEPS,
  StepId,
} from "./constants";
import {
  CompleteStep,
  InviteStep,
  OrganizationStep,
  SpacesStep,
  WelcomeStep,
} from "./onboarding-step";
import { OnboardingProgress } from "./progress";

export type OrganizationWithOnboarding = Organization & {
  onboardingState: OnboardingState | null;
};

export function OrganizationOnboardingPage() {
  const navigate = useNavigate();
  const { data: organization } = useQuery(getUserOrganization);

  const { step = "welcome" } = useParams();
  const { data: user, isLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "",
    teamSize: "",
  });

  useEffect(() => {
    if (organization) {
      const { shouldRedirect, targetStep } = determineOnboardingStep(
        step,
        organization,
      );
      if (shouldRedirect) {
        navigate(targetStep);
      }
    }
  }, [organization, step, navigate]);

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
      console.error("Failed to update onboarding state:", error);
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
    }

    if (organization) {
      await updateProgress(organization.id, currentStep.id);
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
          {currentStep.description && (
            <p className="mt-2 text-gray-600">{currentStep.description}</p>
          )}

          <div className="mt-8">{renderStep()}</div>
        </div>
      </div>
    </div>
  );
}

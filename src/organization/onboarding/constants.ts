import { OnboardingState, Organization } from "wasp/entities";

export type OrganizationWithOnboarding = Organization & {
  onboardingState: OnboardingState | null;
};


type OnboardingStep = {
  id: string;
  title: string;
  name: string;
  description?: string;
  next: string | null;
};

export const ONBOARDING_STEPS: Record<string, OnboardingStep> = {
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

export type StepId = keyof typeof ONBOARDING_STEPS;

export const getOnboardingUpdates = (
  step: string,
): Partial<OnboardingState> => {
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

export const getTargetStep = (
  onboardingState: OnboardingState | null,
  organization: OrganizationWithOnboarding | undefined,
) => {
  if (!onboardingState) return "welcome";
  if (onboardingState.hasInvitedMembers) return "complete";
  if (onboardingState.hasAddedPaymentMethod) return "invite";
  if (onboardingState.hasCompletedProfile) return "spaces";
  return organization ? "spaces" : "welcome";
};

export const determineOnboardingStep = (
  currentStep: string,
  organization: OrganizationWithOnboarding | undefined,
): { shouldRedirect: boolean; targetStep: string } => {
  if (!organization) {
    return { shouldRedirect: false, targetStep: "welcome" };
  }

  const { onboardingState } = organization;

  if (!onboardingState) {
    return { shouldRedirect: false, targetStep: "welcome" };
  }

  if (onboardingState?.hasCompletedOnboarding) {
    return { shouldRedirect: true, targetStep: "/" };
  }

  if (
    (currentStep === "welcome" || currentStep === "organization") &&
    organization
  ) {
    return { shouldRedirect: true, targetStep: "/onboarding/spaces" };
  }

  const targetStep = getTargetStep(onboardingState, organization);

  const currentStepIndex = Object.values(ONBOARDING_STEPS).findIndex(
    (s) => s.id === currentStep,
  );
  const targetStepIndex = Object.values(ONBOARDING_STEPS).findIndex(
    (s) => s.id === targetStep,
  );
  const shouldRedirect = currentStepIndex > targetStepIndex;

  return {
    shouldRedirect,
    targetStep: shouldRedirect ? `/onboarding/${targetStep}` : currentStep,
  };
};

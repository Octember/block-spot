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
    next: "pricing",
  },
  PRICING: {
    id: "pricing",
    name: "Select Plan",
    title: "Choose Your Plan",
    description: "Select the plan that best fits your needs",
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
      updates.hasCreatedFirstSpace = true;
      break;
    case "invite":
      updates.hasInvitedMembers = true;
      break;
    case "pricing":
      updates.hasSelectedPlan = true;
      break;
    case "complete":
      updates.hasCompletedOnboarding = true;
      break;
  }
  return updates;
};

export const getTargetStep = (onboardingState: OnboardingState | null) => {
  if (!onboardingState) return "welcome";
  if (onboardingState.hasCompletedOnboarding) return "complete";
  if (onboardingState.hasSelectedPlan) return "complete";
  if (onboardingState.hasInvitedMembers) return "pricing";
  if (onboardingState.hasCreatedFirstSpace) return "invite";
  if (onboardingState.hasCompletedProfile) return "spaces";
  return "organization";
};

export const determineOnboardingStep = (
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
    return { shouldRedirect: true, targetStep: "/venues" };
  }

  const targetStep = getTargetStep(onboardingState);

  return {
    shouldRedirect: true,
    targetStep: `/onboarding/${targetStep}`,
  };
};


export const TimeZoneOptions = [
  { label: "Pacific Time (PST)", value: "America/Los_Angeles" },
  { label: "Mountain Time (MST)", value: "America/Denver" },
  { label: "Central Time (CST)", value: "America/Chicago" },
  { label: "Eastern Time (EST)", value: "America/New_York" },
  { label: "Atlantic Time (AST)", value: "America/Halifax" },
  { label: "Greenwich Mean Time (GMT)", value: "Europe/London" },
  { label: "Central European Time (CET)", value: "Europe/Berlin" },
  { label: "Eastern European Time (EET)", value: "Europe/Bucharest" },
  { label: "Moscow Standard Time (MSK)", value: "Europe/Moscow" },
  { label: "India Standard Time (IST)", value: "Asia/Kolkata" },
  { label: "China Standard Time (CST)", value: "Asia/Shanghai" },
  { label: "Japan Standard Time (JST)", value: "Asia/Tokyo" },
  { label: "Korea Standard Time (KST)", value: "Asia/Seoul" },
  { label: "Indochina Time (ICT)", value: "Asia/Bangkok" },
  { label: "Western Australia Time (AWST)", value: "Australia/Perth" },
  { label: "Eastern Australia Time (AEST)", value: "Australia/Sydney" },
  { label: "New Zealand Time (NZST)", value: "Pacific/Auckland" },
  { label: "Brasilia Time (BRT)", value: "America/Sao_Paulo" },
  { label: "Argentina Time (ART)", value: "America/Argentina/Buenos_Aires" },
  { label: "South Africa Standard Time (SAST)", value: "Africa/Johannesburg" },
];
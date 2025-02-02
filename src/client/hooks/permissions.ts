import { getUserOrganization, getUserOrganizationRole, useQuery } from "wasp/client/operations";

export const isUserOwner = () => {
  const { data: organizationUser } = useQuery(getUserOrganizationRole);

  return organizationUser?.role === "OWNER";
};

export const hasUserCompletedOnboarding = () => {
  const { data: organization } = useQuery(getUserOrganization);

  return organization?.onboardingState?.hasCompletedOnboarding;
};

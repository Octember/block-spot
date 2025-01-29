import { useAuth } from "wasp/client/auth";
import { getUserOrganization, useQuery } from "wasp/client/operations";

export interface Organization {
  id: string;
  name: string;
  stripeCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionPlanId?: string;
  datePaid?: Date;
  credits?: number;
}

export function useOrganization() {
  const { data: user } = useAuth();

  const { data: organization, isLoading } = useQuery(getUserOrganization, null, {
    enabled: !!user
  });

  return {
    organization,
    isLoading,
  };
} 
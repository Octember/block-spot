import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { getUserOrganization, useQuery } from "wasp/client/operations";
import { PUBLIC_ROUTES } from "../components/constants/public-routes";

export function useOnboardingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  useEffect(() => {
    if (!user || PUBLIC_ROUTES.find((route) => location.pathname.startsWith(route))) {
      return;
    }

    if (!isLoading && !organization) {
      navigate("/onboarding?redirect=true");
    }

    if (organization && !isLoading) {
      const onboardingState = organization.onboardingState;
      if (!onboardingState?.hasCompletedOnboarding) {
        navigate("/onboarding?redirect=true");
      }
    }
  }, [user, organization, location.pathname, navigate]);
}

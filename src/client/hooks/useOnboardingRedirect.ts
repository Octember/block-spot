import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserOrganization, useQuery } from "wasp/client/operations";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";
import { PUBLIC_ROUTES } from "../components/constants/public-routes";

export function useOnboardingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  useEffect(() => {
    if (
      !user ||
      PUBLIC_ROUTES.find((route) => location.pathname.startsWith(route))
    ) {
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

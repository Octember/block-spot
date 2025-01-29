import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { getUserOrganization, useQuery } from "wasp/client/operations";

const disallowedRedirectRoutes = ["/onboarding", "/pricing"];

export function useOnboardingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: organization } = useQuery(getUserOrganization);

  useEffect(() => {
    if (
      user &&
      organization &&
      !disallowedRedirectRoutes.find((route) =>
        location.pathname.startsWith(route),
      )
    ) {
      const onboardingState = organization.onboardingState;
      if (!onboardingState?.hasCompletedOnboarding) {
        navigate("/onboarding?redirect=true");
      }
    }
  }, [user, organization, location.pathname, navigate]);
}

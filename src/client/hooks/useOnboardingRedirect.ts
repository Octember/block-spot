import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { getUserOrganization, useQuery } from "wasp/client/operations";

const disallowedRedirectRoutes = [
  "/onboarding",
  "/pricing",
  "/about",
  "/checkout",
];

export function useOnboardingRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  useEffect(() => {
    if (
      !user ||
      location.pathname === "/" ||
      disallowedRedirectRoutes.find((route) =>
        location.pathname.startsWith(route),
      )
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

import {
  BanknotesIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  Cog8ToothIcon,
  LinkIcon,
  Squares2X2Icon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import { getAllVenues, useQuery } from "wasp/client/operations";
import { routes } from "wasp/client/router";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";

type NavigationItem = {
  name: string;
  route: string;
  icon: React.ElementType;
  count?: string;
  current: boolean;
};

export function useAppNavigation(): NavigationItem[] {
  const { user } = useAuthUser();
  const location = useLocation();

  const { data: venues } = useQuery(getAllVenues, null, { staleTime: 3600000 });

  const firstVenue = venues?.[0];

  const navItems: NavigationItem[] = useMemo(
    () => [
      {
        name: "Venue",
        route: firstVenue
          ? routes.VenuePageRoute.build({
              params: { venueId: firstVenue.id },
            })
          : routes.AllVenuesPageRoute.build({}),
        icon: BuildingOfficeIcon,
        current: firstVenue
          ? location.pathname ===
            routes.VenuePageRoute.build({
              params: { venueId: firstVenue.id },
            })
          : false,
      },
      {
        name: "Spaces",
        route: routes.AllVenuesPageRoute.build({}),
        icon: Squares2X2Icon,
        count: "20+",
        current: location.pathname === routes.AllVenuesPageRoute.build({}),
      },
      {
        name: "Team",
        route: routes.TeamRoute.build({}),
        icon: UsersIcon,
        current: location.pathname === routes.TeamRoute.build({}),
      },
      {
        name: "Availability",
        route: firstVenue
          ? routes.VenuePageRouteChildren.build({
              params: { venueId: firstVenue.id, "*": "availability" },
            })
          : routes.AllVenuesPageRoute.build({}),
        icon: ClockIcon,
        current: firstVenue
          ? location.pathname ===
            routes.VenuePageRouteChildren.build({
              params: { venueId: firstVenue.id, "*": "availability" },
            })
          : false,
      },
      ...(user?.isAdmin
        ? [
            {
              name: "Payments",
              route: firstVenue
                ? routes.VenuePageRouteChildren.build({
                    params: { venueId: firstVenue.id, "*": "payments" },
                  })
                : routes.AllVenuesPageRoute.build({}),
              icon: BanknotesIcon,
              current: firstVenue
                ? location.pathname ===
                  routes.VenuePageRouteChildren.build({
                    params: { venueId: firstVenue.id, "*": "payments" },
                  })
                : false,
            },
          ]
        : []),
      {
        name: "Integrations",
        route: firstVenue
          ? routes.VenuePageRouteChildren.build({
              params: { venueId: firstVenue.id, "*": "integrations" },
            })
          : routes.AllVenuesPageRoute.build({}),
        icon: LinkIcon,
        current: firstVenue
          ? location.pathname ===
            routes.VenuePageRouteChildren.build({
              params: { venueId: firstVenue.id, "*": "integrations" },
            })
          : false,
      },
      {
        name: "Account",
        route: routes.AccountRoute.to,
        icon: Cog8ToothIcon,
        current: location.pathname === routes.AccountRoute.to,
      },
      ...(firstVenue
        ? [
            {
              name: "Calendar",
              route: routes.ScheduleRoute.build({
                params: { venueId: firstVenue.id },
              }),
              icon: CalendarIcon,
              count: "",
              current:
                location.pathname ===
                routes.ScheduleRoute.build({
                  params: { venueId: firstVenue.id },
                }),
            },
          ]
        : []),
    ],
    [user, firstVenue, location.pathname],
  );

  return navItems;
}

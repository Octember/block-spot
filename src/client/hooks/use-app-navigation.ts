import { useMemo } from "react";
import { routes } from "wasp/client/router";
import { useAuth } from "wasp/client/auth";
import {
  BuildingLibraryIcon,
  CalendarIcon,
  Cog8ToothIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { Route } from "wasp/client";
import { useLocation } from "react-router-dom";
import { getAllVenues, useQuery } from "wasp/client/operations";

type NavigationItem = {
  name: string;
  route: string;
  icon: React.ElementType;
  count?: string;
  current: boolean;
};

export function useAppNavigation(): NavigationItem[] {
  const { data: user } = useAuth();
  const location = useLocation();

  const { data: venues } = useQuery(getAllVenues);

  console.log(venues);

  const firstVenue = venues?.[0];

  const navItems: NavigationItem[] = useMemo(
    () => [
      ...(firstVenue
        ? [
            {
              name: "Venue",
              route: routes.VenuePageRoute.build({
                params: { venueId: firstVenue.id },
              }),
              icon: BuildingLibraryIcon,
              count: "20+",
              current: location.pathname === routes.VenuePageRoute.build({
                params: { venueId: firstVenue.id },
              }),
            },
            {
              name: "Spaces",
              route: routes.VenuePageRouteChildren.build({
                params: { venueId: firstVenue.id, "*": "spaces" },
              }),
              icon: Squares2X2Icon,
              count: firstVenue.spaces.length.toString(),
              current:
                location.pathname ===
                routes.VenuePageRouteChildren.build({
                  params: { venueId: firstVenue.id, "*": "spaces" },
                }),
            },
            {
              name: "Calendar",
              route: routes.ScheduleRoute.build({
                params: { venueId: firstVenue.id },
              }),
              icon: CalendarIcon,
              count: firstVenue.spaces.length.toString(),
              current:
                location.pathname ===
                routes.ScheduleRoute.build({
                  params: { venueId: firstVenue.id },
                }),
            },
          ]
        : []),
      {
        name: "Account",
        route: routes.AccountRoute.to,
        icon: Cog8ToothIcon,
        current: location.pathname === routes.AccountRoute.to,
      },
    ],
    [user],
  );

  return navItems;
}

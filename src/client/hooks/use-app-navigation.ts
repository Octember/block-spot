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

type SidebarRoute = {
  name: string;
  route: (venueId: string) => string;
  icon: React.ElementType;
  public?: boolean;
  count?: string;
};

const sidebarRoutes: SidebarRoute[] = [
  {
    name: "Venue",
    route: (venueId) => routes.VenuePageRoute.build({ params: { venueId } }),
    icon: BuildingOfficeIcon,
  },
  {
    name: "Spaces",
    route: () => routes.AllVenuesPageRoute.build({}),
    icon: Squares2X2Icon,
    count: "20+",
  },
  {
    name: "Team",
    route: (venueId) => routes.TeamRoute.build({}),
    icon: UsersIcon,
  },
  {
    name: "Availability",
    route: (venueId) => routes.VenuePageRouteChildren.build({
      params: { venueId, "*": "availability" },
    }),
    icon: ClockIcon,
  },
  {
    name: "Payments",
    route: (venueId) => routes.VenuePageRouteChildren.build({
      params: { venueId, "*": "payments" },
    }),
    icon: BanknotesIcon,
  },
  {
    name: "Integrations",
    route: (venueId) => routes.VenuePageRouteChildren.build({
      params: { venueId, "*": "integrations" },
    }),
    icon: LinkIcon,
  },
  {
    name: "Account",
    route: (venueId) => routes.AccountRoute.to,
    icon: Cog8ToothIcon,
  },
  {
    name: "Calendar",
    route: (venueId) => routes.ScheduleRoute.build({
      params: { venueId },
    }),
    icon: CalendarIcon,
    public: true
  },
];

export function useAppNavigation(): NavigationItem[] {
  const { user, isOwner } = useAuthUser();
  const location = useLocation();
  const { data: venues } = useQuery(getAllVenues, null, { staleTime: 3600000 });
  const firstVenue = venues?.[0];

  const navItems: NavigationItem[] = useMemo(
    () => sidebarRoutes
      .filter(route => route.public || isOwner)
      .map((route) => ({
        name: route.name,
        route: firstVenue ? route.route(firstVenue.id) : routes.AllVenuesPageRoute.build({}),
        icon: route.icon,
        count: route.count,
        current: firstVenue ? location.pathname === route.route(firstVenue.id) : false,
      })),
    [user, firstVenue, location.pathname],
  );

  return navItems;
}

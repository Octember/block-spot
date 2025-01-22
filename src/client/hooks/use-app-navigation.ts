
import { useMemo } from 'react';
import { routes } from 'wasp/client/router';
import { useAuth } from 'wasp/client/auth';
import {BuildingLibraryIcon, CalendarIcon} from '@heroicons/react/24/outline';
import { Route } from 'wasp/client';
import { useLocation } from 'react-router-dom';

type NavigationItem = {
  name: string;
  route: string;
  icon: React.ElementType;
  count?: string;
  current: boolean;
}

export function useAppNavigation(): NavigationItem[] {
  const { data: user } = useAuth();
  const location = useLocation();

  const navItems: NavigationItem[] = useMemo(() => [
    {
      name: 'Venues',
      route: routes.AllVenuesPageRoute.to,
      icon: BuildingLibraryIcon,
      count: '20+',
      current: location.pathname === routes.AllVenuesPageRoute.to,
    },
    {
      name: 'Account',
      route: routes.AccountRoute.to,
      icon: CalendarIcon,
      current: location.pathname === routes.AccountRoute.to,
    },  
  ], [user]);

  return navItems;
}

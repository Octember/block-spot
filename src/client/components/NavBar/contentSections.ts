import { routes } from "wasp/client/router";
import type { NavigationItem } from "../NavBar/NavBar";

export const appNavigationItems: NavigationItem[] = [
  { name: "About", to: routes.AboutRoute.to },
  { name: "Your Space", to: routes.AllVenuesPageRoute.to },
  { name: "Pricing", to: routes.PricingPageRoute.to },
  // { name: "Blog", to: BlogUrl },
];

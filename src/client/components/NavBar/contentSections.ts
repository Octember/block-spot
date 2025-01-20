import type { NavigationItem } from "../NavBar/NavBar";
import { routes } from "wasp/client/router";
import { BlogUrl, DocsUrl } from "../../../shared/common";

export const appNavigationItems: NavigationItem[] = [
  { name: "Your Space", to: routes.AllVenuesPageRoute.to },
  { name: "Pricing", to: routes.PricingPageRoute.to },
  { name: "Documentation", to: DocsUrl },
  { name: "Blog", to: BlogUrl },
];

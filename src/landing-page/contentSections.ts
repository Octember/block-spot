import { routes } from "wasp/client/router";
import type { NavigationItem } from "../client/components/NavBar/NavBar";
import { DocsUrl } from "../shared/common";

export const landingPageNavigationItems: NavigationItem[] = [
  { name: "Features", to: "#features" },
  { name: "Pricing", to: routes.PricingPageRoute.to },
  { name: "Documentation", to: DocsUrl },
  // { name: "Blog", to: BlogUrl },
];

export const features = [
  {
    name: "Smart Scheduling, Simplified",
    description:
      "Manage multiple spaces, staff, and time slots in one clean interface. Drag, drop, done.",
    icon: "📅",
    href: DocsUrl,
  },
  {
    name: "Let Customers Book Themselves (24/7)",
    description:
      "Share your personalized booking page and let customers grab slots instantly — no back-and-forth.",
    icon: "🤝",
    href: DocsUrl,
  },
  {
    name: "Business Hours & Availability",
    description:
      "Set custom hours, block off holidays, or sync with staff schedules. Changes take seconds, not hours.",
    icon: "⏰",
    href: DocsUrl,
  },
  {
    name: "Pricing That Respects Small Budgets",
    description:
      "Start free, then pay as you grow. Plans designed for solos, teams, and multi-location businesses.",
    icon: "💰",
    href: DocsUrl,
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does it work?",
    answer: `
      Set your spaces, hours, and rules.

Share your booking page.
      Let customers book instantly.
      No coding, no chaos.
      `,
  },
  {
    id: 2,
    question: "Can I manage multiple locations or spaces?",
    answer:
      "Absolutely. Add unlimited spaces or venues, each with unique availability and rules—all in one account.",
  },
  {
    id: 3,
    question: "Is this for solo entrepreneurs or teams?",
    answer: "Both. Scale from 1 user to 20+ without switching tools.",
  },
  {
    id: 4,
    question: "Will I need training?",
    answer: "Unlikely. Most users are up and running in 10 minutes.",
  },
];
export const footerNavigation = {
  app: [
    { name: "Documentation", href: DocsUrl },
    // { name: "Blog", href: BlogUrl },
  ],
  company: [
    { name: "About", href: routes.AboutRoute.to },
    { name: "Privacy", href: routes.PrivacyPolicyRoute.to },
    { name: "Terms of Service", href: routes.TermsOfServiceRoute.to },
  ],
};

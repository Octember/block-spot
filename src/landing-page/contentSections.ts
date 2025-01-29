import { routes } from "wasp/client/router";
import type { NavigationItem } from "../client/components/NavBar/NavBar";
import avatarPlaceholder from "../client/static/avatar-placeholder.webp";
import daBoiAvatar from "../client/static/da-boi.webp";
import { BlogUrl, DocsUrl } from "../shared/common";

export const landingPageNavigationItems: NavigationItem[] = [
  { name: "Features", to: "#features" },
  { name: "Pricing", to: routes.PricingPageRoute.to },
  { name: "Documentation", to: DocsUrl },
  { name: "Blog", to: BlogUrl },
];
export const features = [
  {
    name: "Smart Scheduling",
    description:
      "Effortlessly manage multiple spaces and time slots with our intuitive calendar interface.",
    icon: "📅",
    href: DocsUrl,
  },
  {
    name: "Customer Self-Service",
    description:
      "Let customers book their own appointments 24/7, reducing phone calls and email back-and-forth.",
    icon: "🤝",
    href: DocsUrl,
  },
  {
    name: "Business Hours & Availability",
    description:
      "Set custom hours, block off times, and manage availability across different spaces and staff members.",
    icon: "⏰",
    href: DocsUrl,
  },
  {
    name: "Affordable Pricing",
    description:
      "Pay only for what you need with flexible plans designed for small businesses.",
    icon: "💰",
    href: DocsUrl,
  },
];
export const testimonials = [
  {
    name: "Da Boi",
    role: "Wasp Mascot",
    avatarSrc: daBoiAvatar,
    socialUrl: "https://twitter.com/wasplang",
    quote: "I don't even know how to code. I'm just a plushie.",
  },
  {
    name: "Mr. Foobar",
    role: "Founder @ Cool Startup",
    avatarSrc: avatarPlaceholder,
    socialUrl: "",
    quote: "This product makes me cooler than I already am.",
  },
  {
    name: "Jamie",
    role: "Happy Customer",
    avatarSrc: avatarPlaceholder,
    socialUrl: "#",
    quote: "My cats love it!",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does the scheduling system work?",
    answer:
      "Our platform lets you set up your available spaces, business hours, and booking rules. Customers can then book available slots through your personalized booking page.",
  },
  {
    id: 2,
    question: "Can I manage multiple locations or spaces?",
    answer:
      "Yes! You can set up multiple venues and spaces, each with their own availability and booking rules.",
  },
  {
    id: 3,
    question: "What size business is this suitable for?",
    answer:
      "Our platform is perfect for small businesses - from solo practitioners to businesses with multiple staff and locations.",
  },
  {
    id: 4,
    question: "Do I need technical knowledge to use it?",
    answer:
      "Not at all! Our interface is designed to be user-friendly and intuitive. You can be up and running in minutes.",
  },
];
export const footerNavigation = {
  app: [
    { name: "Documentation", href: DocsUrl },
    { name: "Blog", href: BlogUrl },
  ],
  company: [
    { name: "About", href: routes.AboutRoute.to },
    { name: "Privacy", href: routes.PrivacyPolicyRoute.to },
    { name: "Terms of Service", href: routes.TermsOfServiceRoute.to },
  ],
};

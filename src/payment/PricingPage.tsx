import { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useAuth } from "wasp/client/auth";
import {
  generateCheckoutSession,
  getCustomerPortalUrl,
  useQuery,
} from "wasp/client/operations";
import { cn } from "../client/cn";
import { useOrganization } from "../organization/hooks/use-organization";
import { PaymentPlanId, prettyPaymentPlanName } from "./plans";

const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.Business;

interface PaymentPlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const paymentPlanCards: Record<PaymentPlanId, PaymentPlanCard> = {
  [PaymentPlanId.Community]: {
    name: prettyPaymentPlanName(PaymentPlanId.Community),
    price: "$5",
    description: "Perfect for small businesses and community centers",
    features: [
      "Unlimited bookings per month",
      "Drag-and-drop calendar",
      "One location",
      "One admin user",
      "Calendar sync",
      "Basic support",
    ],
  },
  [PaymentPlanId.Business]: {
    name: prettyPaymentPlanName(PaymentPlanId.Business),
    price: "$25",
    description: "For growing businesses with multiple venues",
    features: [
      "Everything in the Community plan",
      "Unlimited bookings",
      "Multiple venues & spaces",
      "Priority support",
      "Advanced availability rules",
      "Analytics & reporting",
    ],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);

  const { data: user } = useAuth();
  const { organization } = useOrganization();

  const isOrganizationSubscribed =
    !!organization &&
    !!organization.subscriptionStatus &&
    organization.subscriptionStatus !== "deleted";

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(
    getCustomerPortalUrl,
    { organizationId: organization?.id ?? "" },
    {
      enabled: isOrganizationSubscribed && !!organization?.id,
    },
  );

  const navigate = useNavigate();

  async function handleBuyNowClick(planId: PaymentPlanId) {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!organization) {
      navigate("/organization/new");
      return;
    }

    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession({
        organizationId: organization.id,
        planId,
      });

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error) {
      console.error(error);
      setIsPaymentLoading(false);
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!organization) {
      throw new Error("Organization not found");
    }

    if (customerPortalUrlError) {
      console.error("Error fetching customer portal url");
    }

    if (!customerPortalUrl) {
      throw new Error(
        `Customer Portal does not exist for organization ${organization.id}`,
      );
    }

    window.open(customerPortalUrl, "_blank");
  };

  return (
    <div className="py-8 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pricing plans for teams of&nbsp;all&nbsp;sizes
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Choose the plan that best fits your needs. All plans include a 30-day
          free trial.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
          {Object.entries(paymentPlanCards).map(([planId, card]) => (
            <div
              key={planId}
              className={cn(
                "rounded-3xl p-8 xl:p-10 bg-white",
                {
                  "ring-2 ring-gray-200 my-4": planId !== bestDealPaymentPlanId,
                },
                { "ring-2 ring-teal-600": planId === bestDealPaymentPlanId },
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h2
                  id={`${card.name}-heading`}
                  className="text-lg font-semibold leading-8 text-gray-900"
                >
                  {card.name}
                </h2>
                {planId === bestDealPaymentPlanId && (
                  <p className="rounded-full bg-teal-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-teal-600">
                    Most popular
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {card.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {card.price}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600">
                  /month
                </span>
              </p>
              {isOrganizationSubscribed ? (
                <button
                  onClick={handleCustomerPortalClick}
                  disabled={isCustomerPortalUrlLoading}
                  aria-label="Manage subscription"
                  className={cn(
                    "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    planId === bestDealPaymentPlanId
                      ? "bg-teal-700 text-white shadow-sm hover:bg-teal-600 focus-visible:outline-teal-600"
                      : "bg-white text-teal-800 ring-1 ring-inset ring-teal-500 hover:ring-teal-600",
                  )}
                >
                  {isCustomerPortalUrlLoading
                    ? "Loading..."
                    : "Manage Subscription"}
                </button>
              ) : (
                <button
                  onClick={() => handleBuyNowClick(planId as PaymentPlanId)}
                  disabled={isPaymentLoading}
                  aria-label={`Buy ${card.name} plan`}
                  className={cn(
                    "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    planId === bestDealPaymentPlanId
                      ? "bg-teal-700 text-white shadow-sm hover:bg-teal-600 focus-visible:outline-teal-600"
                      : "bg-white text-teal-600 ring-1 ring-inset ring-teal-200 hover:ring-teal-300",
                  )}
                >
                  {isPaymentLoading ? "Loading..." : "Buy plan"}
                </button>
              )}
              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-gray-600"
              >
                {card.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <AiFillCheckCircle
                      className="h-6 w-5 flex-none text-teal-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

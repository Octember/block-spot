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
import { PaymentPlanId, paymentPlans, prettyPaymentPlanName } from "./plans";

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
    price: "Free Forever",
    description: "Perfect for small businesses just getting started",
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
    price: "$19.99",
    description: "For growing businesses with multiple venues",
    features: [
      "Everything in the Community plan",
      "Unlimited bookings",
      "Multiple venues & spaces",
      "Priority support",
      "Advanced availability rules",
      "Staff management",
      "Analytics & reporting",
    ],
  },
};

const PricingPage = () => {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);

  const { data: user } = useAuth();
  const isUserSubscribed =
    !!user &&
    !!user.subscriptionStatus &&
    user.subscriptionStatus !== "deleted";

  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl, { enabled: isUserSubscribed });

  const navigate = useNavigate();

  async function handleBuyNowClick(paymentPlanId: PaymentPlanId) {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession(paymentPlanId);

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error) {
      console.error(error);
      setIsPaymentLoading(false); // We only set this to false here and not in the try block because we redirect to the checkout url within the same window
    }
  }

  const handleCustomerPortalClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (customerPortalUrlError) {
      console.error("Error fetching customer portal url");
    }

    if (!customerPortalUrl) {
      throw new Error(`Customer Portal does not exist for user ${user.id}`);
    }

    window.open(customerPortalUrl, "_blank");
  };

  return (
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div id="pricing" className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Pick your <span className="text-sky-500">pricing</span>
          </h2>
        </div>

        <p className="mt-6 mx-auto max-w-2xl text-lg leading-8 text-gray-600 dark:text-white prose hidden md:block">
          We pride ourselves on offering a truly accessible free plan, perfect for
          small businesses, community centers, and nonprofits just getting started.
          For growing organizations, our feature-packed paid plan is just $25/month—delivering powerful tools at a fraction of what other platforms charge.
        </p>

        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-y-8 md:gap-x-8  md:mx-0 md:max-w-none md:grid-cols-2">
          {Object.values(PaymentPlanId).map((planId) => (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col grow justify-between rounded-3xl ring-gray-900/10 dark:ring-gray-100/10 overflow-hidden p-8 xl:p-10",
                {
                  "ring-2": planId === bestDealPaymentPlanId,
                  "ring-1": planId !== bestDealPaymentPlanId,
                },
              )}
            >
              {planId === bestDealPaymentPlanId && (
                <div
                  className="absolute top-0 right-0 -z-10 w-full h-full transform-gpu blur-3xl"
                  aria-hidden="true"
                >
                  <div
                    className="absolute w-full h-full bg-gradient-to-br from-violet-400 to-sky-500 opacity-30 dark:opacity-50"
                    style={{
                      clipPath: "circle(670% at 50% 50%)",
                    }}
                  />
                </div>
              )}
              <div className="mb-8">
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={planId}
                    className="text-gray-900 text-lg font-semibold leading-8 dark:text-white"
                  >
                    {paymentPlanCards[planId].name}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-white">
                  {paymentPlanCards[planId].description}
                </p>
                <p className="mt-6 flex items-baseline gap-x-1 dark:text-white">
                  <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {paymentPlanCards[planId].price}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-white">
                    {paymentPlans[planId].effect.kind === "subscription" &&
                      "/month"}
                  </span>
                </p>
                <ul
                  role="list"
                  className="mt-8 space-y-3 text-sm leading-6 text-gray-600 dark:text-white"
                >
                  {paymentPlanCards[planId].features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <AiFillCheckCircle
                        className="h-6 w-5 flex-none text-green-500"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {isUserSubscribed ? (
                <button
                  onClick={handleCustomerPortalClick}
                  disabled={isCustomerPortalUrlLoading}
                  aria-describedby="manage-subscription"
                  className={cn(
                    "mt-8 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400",
                    {
                      "bg-sky-500 text-white hover:text-white shadow-sm hover:bg-sky-400":
                        planId === bestDealPaymentPlanId,
                      "text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-400":
                        planId !== bestDealPaymentPlanId,
                    },
                  )}
                >
                  Manage Subscription
                </button>
              ) : (
                <button
                  onClick={() => handleBuyNowClick(planId)}
                  aria-describedby={planId}
                  className={cn(
                    {
                      "bg-sky-500 text-white hover:text-white shadow-sm hover:bg-sky-400":
                        planId === bestDealPaymentPlanId,
                      "text-gray-600  ring-1 ring-inset ring-gray-200 hover:ring-gray-400 bg-white hover:bg-gray-50":
                        planId !== bestDealPaymentPlanId,
                    },
                    {
                      "opacity-50 cursor-wait": isPaymentLoading,
                    },
                    "mt-8 block rounded-md py-2 px-3 text-center text-sm dark:text-white font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400",
                  )}
                  disabled={isPaymentLoading}
                >
                  {user ?
                    (planId === PaymentPlanId.Community ?
                      "Get started for free"
                      :
                      "Buy plan")
                    :
                    (planId === PaymentPlanId.Community ?
                      "Log in to get started"
                      :
                      "Log in to buy plan")
                  }
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

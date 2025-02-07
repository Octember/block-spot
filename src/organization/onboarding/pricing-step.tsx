import { useState } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { generateCheckoutSession } from "wasp/client/operations";
import { cn } from "../../client/cn";
import { useToast } from "../../client/toast";
import { PaymentPlanId } from "../../payment/plans";
import { paymentPlanCards } from "../../payment/PricingPage";

interface ErrorResponse {
  message?: string;
  [key: string]: unknown;
}

export function PricingStep({
  onNext,
  organizationId,
}: {
  onNext: () => void;
  organizationId: string;
}) {
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const toast = useToast();
  const bestDealPaymentPlanId: PaymentPlanId = PaymentPlanId.Business;

  async function handleSelectPlan(planId: PaymentPlanId) {
    try {
      setIsPaymentLoading(true);

      const checkoutResults = await generateCheckoutSession({
        organizationId,
        planId,
        returnToOnboarding: true,
      });

      if (checkoutResults?.sessionUrl) {
        window.open(checkoutResults.sessionUrl, "_self");
      } else {
        throw new Error("Error generating checkout session URL");
      }
    } catch (error: unknown) {
      const err = error as ErrorResponse;
      console.error(err);
      toast({
        type: "error",
        title: "Failed to setup payment",
        description: err.message || "Please try again",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  }

  async function handleSelectFreePlan() {
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="prose">
        <p>
          Choose the plan that best fits your needs. All paid plans include a
          30-day free trial.
        </p>
      </div>

      <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-x-8 xl:gap-x-12">
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
            <button
              onClick={() => {
                if (planId === PaymentPlanId.Community) {
                  handleSelectFreePlan();
                } else {
                  handleSelectPlan(planId as PaymentPlanId);
                }
              }}
              disabled={isPaymentLoading}
              aria-label={`Select ${card.name} plan`}
              className={cn(
                "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                planId === bestDealPaymentPlanId
                  ? "bg-teal-700 text-white shadow-sm hover:bg-teal-600 focus-visible:outline-teal-600"
                  : "bg-white text-teal-600 ring-1 ring-inset ring-teal-500 hover:ring-teal-600",
              )}
            >
              {getButtonText(planId as PaymentPlanId, isPaymentLoading)}
            </button>
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
  );
}

function getButtonText(planId: PaymentPlanId, isLoading: boolean) {
  if (isLoading) {
    return "Loading...";
  }

  if (planId === PaymentPlanId.Community) {
    return "Start for free";
  }

  return "Start free trial";
}

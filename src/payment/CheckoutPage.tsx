import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getUserOrganization,
  updateOnboardingState,
  useQuery,
} from "wasp/client/operations";
import { hasUserCompletedOnboarding } from "../client/hooks/permissions";

export default function CheckoutPage() {
  const [paymentStatus, setPaymentStatus] = useState("loading");

  const completedOnboarding = hasUserCompletedOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: organization } = useQuery(getUserOrganization);

  useEffect(() => {
    function delayedRedirect() {
      const latency = completedOnboarding ? 2000 : 4000;
      const route = completedOnboarding ? "/account" : "/onboarding";

      if (!completedOnboarding && organization) {
        updateOnboardingState({
          organizationId: organization.id,
          updates: {
            hasSelectedPlan: true,
          },
        });
      }

      return setTimeout(() => {
        navigate(route);
      }, latency);
    }

    const queryParams = new URLSearchParams(location.search);
    const isSuccess = queryParams.get("success");
    const isCanceled = queryParams.get("canceled");

    if (isCanceled) {
      setPaymentStatus("canceled");
    } else if (isSuccess) {
      setPaymentStatus("paid");
    } else {
      navigate("/account");
    }
    delayedRedirect();
    return () => {
      clearTimeout(delayedRedirect());
    };
  }, [location]);

  return (
    <div className="flex min-h-full flex-col justify-center mt-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow-xl ring-1 ring-gray-900/10 dark:ring-gray-100/10 sm:rounded-lg sm:px-10">
          <h1>
            {paymentStatus === "paid"
              ? "🥳 Payment Successful!"
              : paymentStatus === "canceled"
                ? "😢 Payment Canceled"
                : paymentStatus === "error" && "🙄 Payment Error"}
          </h1>
          {paymentStatus !== "loading" && (
            <span className="text-center">
              You are being redirected... <br />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

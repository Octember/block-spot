import { BoltIcon } from "@heroicons/react/20/solid";
import {
  getCustomerPortalUrl,
  useQuery,
  generateCheckoutSession,
} from "wasp/client/operations";
import { Button } from "../../../client/components/button";
import { PaymentPlanId } from "../../../payment/plans";
import { Organization } from "wasp/entities";
import { BiLoaderCircle } from "react-icons/bi";
import { useState } from "react";

type UpgradeButtonProps = {
  organization: Organization;
};

export function UpgradeButton({ organization }: UpgradeButtonProps) {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  async function handleBuyNowClick(planId: PaymentPlanId) {
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
  return (
    <div>
      <Button
        variant="primary"
        isLoading={isPaymentLoading}
        icon={<BoltIcon className="size-4" />}
        onClick={() => handleBuyNowClick(PaymentPlanId.Business)}
        ariaLabel="Upgrade to Business Tier"
        disabled={isPaymentLoading}
      >
        Upgrade to Business Tier
      </Button>
    </div>
  );
}

export function CustomerPortalButton() {
  const {
    data: customerPortalUrl,
    isLoading: isCustomerPortalUrlLoading,
    error: customerPortalUrlError,
  } = useQuery(getCustomerPortalUrl);

  const handleClick = () => {
    if (customerPortalUrlError) {
      console.error("Error fetching customer portal url");
    }

    if (customerPortalUrl) {
      window.open(customerPortalUrl, "_blank");
    } else {
      console.error("Customer portal URL is not available");
    }
  };

  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      <button
        onClick={handleClick}
        disabled={isCustomerPortalUrlLoading}
        className="font-medium text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Manage Subscription
      </button>
    </div>
  );
}

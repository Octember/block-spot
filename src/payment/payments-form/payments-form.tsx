import { useState } from "react";
import { BiLoaderCircle } from "react-icons/bi";
import {
  createStripeAccount,
  createStripeAccountLink,
} from "wasp/client/operations";
import { Organization } from "wasp/entities";
import { Button } from "../../client/components/button";
import { Switch } from "../../client/components/switch";
import { useToast } from "../../client/toast";
import { LuExternalLink } from "react-icons/lu";

export const PaymentsForm = ({
  organization,
}: {
  organization: Organization;
}) => {
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  async function handleEnablePayment() {
    setIsLoading(true);
    try {
      await createStripeAccount();
      toast({
        title: "Stripe account created",
        description: "You can now start accepting payments",
      });
    } catch (error: any) {
      toast({
        title: "Failed to create Stripe account",
        description: error?.message,
        type: "error",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="prose">
      <p className="flex items-center gap-2">
        <label>
          Stripe status:{" "}
          <span
            className={`font-bold ${organization?.stripeAccountId ? "text-teal-900" : "text-red-500"}`}
          >
            {organization?.stripeAccountId ? "Connected" : "Not connected"}
          </span>
        </label>
        <Switch
          disabled={Boolean(organization?.stripeAccountId)}
          value={Boolean(organization?.stripeAccountId)}
          onChange={handleEnablePayment}
        />
        {isLoading && <BiLoaderCircle className="size-6 animate-spin" />}
      </p>

      <p className="flex flex-row items-center gap-2">
        <StripeDashboardButton />
      </p>
    </div>
  );
};

const StripeDashboardButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  async function handleStripeConnect() {
    setIsLoading(true);
    const result = await createStripeAccountLink();

    window.open(result, "_blank");
    setIsLoading(false);
  }

  return (
    <Button
      ariaLabel="View Stripe Dashboard"
      icon={<LuExternalLink className="size-4" />}
      onClick={handleStripeConnect}
      isLoading={isLoading}
    >
      View Stripe Dashboard
    </Button>
  );
};

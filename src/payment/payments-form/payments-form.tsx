import { useState } from "react";
import { BiLoaderCircle } from "react-icons/bi";
import {
  createStripeAccount,
  createStripeAccountLink,
} from "wasp/client/operations";
import { Organization } from "wasp/entities";
import { Button } from "../../client/components/button";
import { Switch } from "../../client/components/switch";

export const PaymentsForm = ({
  organization,
}: {
  organization: Organization;
}) => {
  async function handleEnablePayment() {
    await createStripeAccount();
  }

  return (
    <div className="prose">
      <p className="flex items-center gap-2">
        <label>Enable payment for bookings</label>
        <Switch
          disabled={Boolean(organization?.stripeAccountId)}
          value={Boolean(organization?.stripeAccountId)}
          onChange={handleEnablePayment}
        />
      </p>

      <p className="flex flex-row items-center gap-2">
        <label>View your stripe dashboard</label>
        <StripeConnectButton />
      </p>
    </div>
  );
};

const StripeConnectButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  async function handleStripeConnect() {
    setIsLoading(true);
    const result = await createStripeAccountLink();

    window.open(result, "_blank");
    setIsLoading(false);
  }

  return (
    <Button
      ariaLabel="Connect to Stripe"
      onClick={handleStripeConnect}
      icon={isLoading ? <BiLoaderCircle className="animate-spin" /> : undefined}
    >
      Connect to Stripe
    </Button>
  );
};

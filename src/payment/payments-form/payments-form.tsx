import { Venue } from "@prisma/client";
import { useState } from "react";
import { BiLoaderCircle } from "react-icons/bi";
import {
  createStripeAccount,
  createStripeAccountLink,
} from "wasp/client/operations";
import { Button } from "../../client/components/button";
import {
  useOrganization
} from "../../organization/hooks/use-organization";

export const PaymentsForm = ({ venue }: { venue: Venue }) => {
  const { isLoading: isOrganizationLoading, organization } = useOrganization();

  async function handleEnablePayment() {
    const result = await createStripeAccount();
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <label>Enable payment for bookings</label>

        {!organization?.stripeAccountId && (
          <button onClick={handleEnablePayment}>Enable</button>
        )}

        <p>Stripe account id: {organization?.stripeAccountId}</p>
      </div>

      {organization && (
        <div>
          <p>Stripe account id: {organization?.stripeAccountId}</p>
          <StripeConnectButton />
        </div>
      )}
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

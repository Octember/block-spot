import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  createConnectCheckoutSession,
  confirmPaidBooking,
} from "wasp/client/operations";
import { Organization } from "wasp/entities";
import { LoadingSpinnerSmall } from "../../../../admin/layout/LoadingSpinner";
import { getConnectedStripePromise } from "../../../../payment/stripe/stripe-react";
import { useParams } from "react-router-dom";

export const useCheckoutSession = () => {
  const [checkoutSession, setCheckoutSession] = useState<{
    clientSecret: string;
    checkoutSessionId: string;
  } | null>(null);

  useEffect(() => {
    createConnectCheckoutSession({
      userId: "1",
      spaceId: "1",
      startTime: new Date(),
      endTime: new Date(),
    }).then(
      ({ clientSecret, checkoutSessionId }) => {
        setCheckoutSession({ clientSecret, checkoutSessionId });
      },
    );
  }, []);

  return {
    ...checkoutSession,
  };
};

export const StripeCheckoutForm = () => {
  return <EmbeddedCheckout />;
};

export const StripeWrapper: FC<{
  children: React.ReactNode;
  organization?: Organization;
}> = ({ children, organization }) => {
  const { venueId } = useParams<{ venueId: string }>();
  const { clientSecret, checkoutSessionId } = useCheckoutSession();

  const stripePromise = useMemo(() => {
    if (!organization?.stripeAccountId) {
      return undefined;
    }
    return getConnectedStripePromise(organization.stripeAccountId);
  }, [organization?.stripeAccountId]);

  if (!clientSecret || !stripePromise) {
    console.warn("no client secret or stripe promise");
    return <LoadingSpinnerSmall />;
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        onComplete: async () => {
          console.log("onComplete", checkoutSessionId);
          if (!checkoutSessionId) {
            console.error("No checkout session ID");
            return;
          }

          try {
            const updatedReservation = await confirmPaidBooking({
              checkoutSessionId,
              venueId: venueId ?? "",
            });
            console.log("Payment confirmed:", updatedReservation);
            // You can add UI feedback here, like showing a success message
            // or redirecting to a confirmation page
          } catch (error) {
            console.error("Failed to confirm payment:", error);
            // Handle the error appropriately in the UI
          }
        },
      }}
    >
      {children}
    </EmbeddedCheckoutProvider>
  );
};

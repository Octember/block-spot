import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  useFormContext
} from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  confirmPaidBooking,
  createConnectCheckoutSession,
} from "wasp/client/operations";
import { Organization } from "wasp/entities";
import { LoadingSpinnerSmall } from "../../../../admin/layout/LoadingSpinner";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { getConnectedStripePromise } from "../../../../payment/stripe/stripe-react";
import { CreateReservationFormInputs } from '../modals/types';

export const useCheckoutSession = (spaceId: string) => {
  const { user } = useAuthUser();

  const [checkoutSession, setCheckoutSession] = useState<{
    clientSecret: string;
    checkoutSessionId: string;
  } | null>(null);
  const { setValue } = useFormContext<CreateReservationFormInputs>();

  useEffect(() => {
    createConnectCheckoutSession({
      userId: user?.id ?? "",
      spaceId: spaceId,
      startTime: new Date(),
      endTime: new Date(),
    }).then(({ clientSecret, checkoutSessionId }) => {
      setCheckoutSession({ clientSecret, checkoutSessionId });
    }).catch((error) => {
      console.error("Failed to create checkout session:", error);

      setValue("step", 'error',);
    });
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
  spaceId: string;
}> = ({ children, organization, spaceId }) => {
  const { venueId } = useParams<{ venueId: string }>();
  const [refundMessage, setRefundMessage] = useState<string | null>();
  const { clientSecret, checkoutSessionId } = useCheckoutSession(spaceId);

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
            await confirmPaidBooking({
              checkoutSessionId,
              venueId: venueId ?? "",
            });
            console.log("Payment confirmed!");
          } catch (error: any) {
            if (error?.message?.includes("Refund issued")) {
              setRefundMessage(
                "Sorry, the slot was taken before your payment completed. You have been refunded.",
              );
            } else {
              console.error("Failed to confirm payment:", error);
            }
          }
        },
      }}
    >
      {children}
      {refundMessage && (
        <p className="text-red-500 text-xl font-bold mt-4">{refundMessage}</p>
      )}
    </EmbeddedCheckoutProvider>
  );
};

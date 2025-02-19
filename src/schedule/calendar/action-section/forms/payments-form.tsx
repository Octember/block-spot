import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { createConnectCheckoutSession } from "wasp/client/operations";
import { Organization } from 'wasp/entities';
import { LoadingSpinnerSmall } from '../../../../admin/layout/LoadingSpinner';
import { getConnectedStripePromise } from '../../../../payment/stripe/stripe-react';

export const useCheckoutSession = () => {
  const [checkoutSession, setCheckoutSession] = useState<{ clientSecret: string, checkoutSessionId: string } | null>(null);

  useEffect(() => {
    createConnectCheckoutSession().then(({ clientSecret, checkoutSessionId }) => {
      setCheckoutSession({ clientSecret, checkoutSessionId });
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
  children: React.ReactNode,
  organization?: Organization
}> = ({ children, organization }) => {

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

  return <EmbeddedCheckoutProvider
    stripe={stripePromise}
    options={{
      clientSecret,
      onComplete: () => {
        // 
        console.log("onComplete", checkoutSessionId);


        // TODO: Call another API to verify payment
        // e.g. await markReservationPaid(checkoutSessionId)

        // Handle failed payments....
        // TODO: Use action payment dollar amount
        // Use action payment dollar amount
        // mark reservation as paid
        // Save session ID to DB somewhere??
        // Show UI "paid"
      }
    }}

  >
    {children}
  </EmbeddedCheckoutProvider >
}
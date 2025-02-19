import { EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { createConnectCheckoutSession } from "wasp/client/operations";

export const useClientSecret = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    createConnectCheckoutSession().then(({ clientSecret }) => {
      setClientSecret(clientSecret);
    });
  }, []);

  return {
    clientSecret,
  };
};

export const StripeCheckoutForm = () => {
  return <EmbeddedCheckout />;
};

import { loadStripe } from "@stripe/stripe-js";
import { env } from "wasp/client";

// @ts-expect-error xdasdsa
export const stripePromise = loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export function getConnectedStripePromise(accountId: string) {
  // @ts-expect-error xyzasd
  return loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY, {
    stripeAccount: accountId,
  });
}

import { loadStripe } from "@stripe/stripe-js";
import { env } from "wasp/client";

// @ts-expect-error idk
export const stripePromise = loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export function getConnectedStripePromise(accountId: string) {
  // @ts-expect-error idk
  return loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY, {
    stripeAccount: accountId,
  });
}

import { loadStripe } from "@stripe/stripe-js";
import { env } from "wasp/client";

export const stripePromise = loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export function getConnectedStripePromise(accountId: string) {
  return loadStripe(env.REACT_APP_STRIPE_PUBLISHABLE_KEY, {
    stripeAccount: accountId,
  });
}

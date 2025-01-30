import Stripe from "stripe";
import type { StripeMode } from "./paymentProcessor";
import { stripe } from "./stripeClient";

// WASP_WEB_CLIENT_URL will be set up by Wasp when deploying to production: https://wasp-lang.dev/docs/deploying
const DOMAIN = process.env.WASP_WEB_CLIENT_URL || "http://localhost:3000";

export async function fetchStripeCustomer(
  organizationId: string,
  organizationEmail: string,
) {
  let customer: Stripe.Customer;
  try {
    // First try to find by metadata.organizationId
    const existingCustomers = await stripe.customers.search({
      query: `metadata['organizationId']:'${organizationId}'`,
      limit: 1,
    });

    if (existingCustomers.data.length) {
      console.log("using existing customer by organizationId");
      customer = existingCustomers.data[0];
    } else {
      // Fallback to email search for legacy customers
      const stripeCustomers = await stripe.customers.list({
        email: organizationEmail,
      });

      if (stripeCustomers.data.length) {
        console.log("using existing customer by email");
        customer = stripeCustomers.data[0];
        // Update customer with organizationId metadata
        customer = await stripe.customers.update(customer.id, {
          metadata: { organizationId },
        });
      } else {
        console.log("creating new customer");
        customer = await stripe.customers.create({
          email: organizationEmail,
          metadata: { organizationId },
        });
      }
    }
    return customer;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function createStripeCheckoutSession({
  organizationId,
  priceId,
  customerId,
  mode,
}: {
  organizationId: string;
  priceId: string;
  customerId: string;
  mode: StripeMode;
}) {
  try {
    return await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${DOMAIN}/checkout?success=true`,
      cancel_url: `${DOMAIN}/checkout?canceled=true`,
      automatic_tax: { enabled: true },
      customer_update: {
        address: "auto",
      },
      customer: customerId,
      subscription_data: {
        trial_period_days: 30,
        metadata: { organizationId },
      },
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
}

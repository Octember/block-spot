import { HttpError } from "wasp/server";

import { config } from "wasp/server";
import {
  CreateStripeAccount,
  CreateStripeAccountLink,
} from "wasp/server/operations";
import {
  createStripeAccountApiCall,
  getUserOrganization,
} from "./connect/utils";
import { stripe } from "./stripeClient";

export const createStripeAccount: CreateStripeAccount = async (
  _args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { user, organization } = await getUserOrganization(
    context.user.id,
    context.entities.User,
  );

  if (organization.stripeAccountId) {
    throw new HttpError(400, "Organization already has a Stripe account");
  }

  const accountId = await createStripeAccountApiCall(user, organization);

  // update the organization with the new account id
  await context.entities.Organization.update({
    where: { id: organization.id },
    data: { stripeAccountId: accountId },
  });

  return accountId;
};

function getFrontendUrl() {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'development') {
    return 'http://localhost:3000';
  }
  return config.frontendUrl;
}

export const createStripeAccountLink: CreateStripeAccountLink<
  never,
  string
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { organization } = await getUserOrganization(
    context.user.id,
    context.entities.User,
  );

  const account = organization.stripeAccountId;

  if (!account) {
    throw new HttpError(400, "Organization does not have a Stripe account");
  }

  const frontendUrl = getFrontendUrl();

  console.log("frontendUrl", frontendUrl);

  const accountLink = await stripe.accountLinks.create({
    account: account,
    return_url: `${frontendUrl}/stripe-return/${account}`,
    refresh_url: `${frontendUrl}/stripe-refresh/${account}`,
    type: "account_onboarding",
  });

  return accountLink.url;
};

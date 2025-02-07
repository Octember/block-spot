import { PrismaClient } from "@prisma/client";
import { Organization, User } from "wasp/entities";
import { HttpError } from "wasp/server";
import { stripe } from '../stripeClient';

export async function getUserOrganization(
  userId: string,
  userDelegate: PrismaClient["user"],
): Promise<{ user: User; organization: Organization }> {
  const user = await userDelegate.findUnique({
    where: {
      id: userId,
    },
    include: {
      organizations: {
        include: {
          organization: true,
        },
      },
    },
  });

  const organizationUser = user?.organizations.pop();

  if (!user || !organizationUser || organizationUser.role !== "OWNER") {
    throw new HttpError(401, "User is not an owner of the organization");
  }

  return {
    user,
    organization: organizationUser.organization,
  };
}

export async function createStripeAccountApiCall(user: User, organization: Organization): Promise<string> {
  try {
    const account = await stripe.accounts.create({
      email: user.email || undefined,
      metadata: {
        organizationId: organization.id,
        organizationName: organization.name,
      },
    });

    return account.id;
  } catch (error) {
    console.error(
      "An error occurred when calling the Stripe API to create an account",
      error
    );
    throw new HttpError(500, "An error occurred when calling the Stripe API to create an account");
  }
}
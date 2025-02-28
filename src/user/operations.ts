import {
  type UpdateUserById,
  type GetPaginatedUsers,
  UpdateCurrentUserLastActiveTimestamp,
} from "wasp/server/operations";
import { type User, OrganizationUser } from "wasp/entities";
import { HttpError } from "wasp/server";
import { type SubscriptionStatus } from "../payment/plans";
import { type SearchUsers } from "wasp/server/operations";

export const updateUserById: UpdateUserById<
  { id: string; data: Partial<User> },
  User
> = async ({ id, data }, context) => {
  if (!context.user) {
    console.log(`[USERS] Unauthorized attempt to update user ${id}`);
    throw new HttpError(401);
  }

  if (!context.user.isAdmin) {
    console.log(`[USERS] Non-admin user ${context.user.id} attempted to update user ${id}`);
    throw new HttpError(403);
  }

  console.log(`[USERS] Admin ${context.user.id} updating user ${id}`);
  const updatedUser = await context.entities.User.update({
    where: {
      id,
    },
    data,
  });

  return updatedUser;
};

export const updateCurrentUserLastActiveTimestamp: UpdateCurrentUserLastActiveTimestamp<
  void,
  User
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  return context.entities.User.update({
    where: {
      id: context.user.id,
    },
    data: {
      lastActiveTimestamp: new Date(),
    },
  });
};

type GetPaginatedUsersInput = {
  skip: number;
  cursor?: number | undefined;
  emailContains?: string;
  isAdmin?: boolean;
  subscriptionStatus?: SubscriptionStatus[];
};
type GetPaginatedUsersOutput = {
  users: Pick<
    User,
    | "id"
    | "email"
    | "username"
    | "lastActiveTimestamp"
    | "subscriptionStatus"
    | "paymentProcessorUserId"
  >[];
  totalPages: number;
};

export const getPaginatedUsers: GetPaginatedUsers<
  GetPaginatedUsersInput,
  GetPaginatedUsersOutput
> = async (args, context) => {
  if (!context.user?.isAdmin) {
    console.log(`[USERS] Unauthorized attempt to access paginated users list`);
    throw new HttpError(401);
  }

  console.log(`[USERS] Fetching paginated users (skip: ${args.skip}, email contains: ${args.emailContains || 'none'})`);

  const allSubscriptionStatusOptions = args.subscriptionStatus as
    | Array<string | null>
    | undefined;
  const hasNotSubscribed = allSubscriptionStatusOptions?.find(
    (status) => status === null,
  );
  const subscriptionStatusStrings = allSubscriptionStatusOptions?.filter(
    (status) => status !== null,
  ) as string[] | undefined;

  const queryResults = await context.entities.User.findMany({
    skip: args.skip,
    take: 10,
    where: {
      AND: [
        {
          email: {
            contains: args.emailContains || undefined,
            mode: "insensitive",
          },
          isAdmin: args.isAdmin,
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: subscriptionStatusStrings,
              },
            },
            {
              subscriptionStatus: {
                equals: hasNotSubscribed,
              },
            },
          ],
        },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      isAdmin: true,
      lastActiveTimestamp: true,
      subscriptionStatus: true,
      paymentProcessorUserId: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const totalUserCount = await context.entities.User.count({
    where: {
      AND: [
        {
          email: {
            contains: args.emailContains || undefined,
            mode: "insensitive",
          },
          isAdmin: args.isAdmin,
        },
        {
          OR: [
            {
              subscriptionStatus: {
                in: subscriptionStatusStrings,
              },
            },
            {
              subscriptionStatus: {
                equals: hasNotSubscribed,
              },
            },
          ],
        },
      ],
    },
  });
  const totalPages = Math.ceil(totalUserCount / 10);

  return {
    users: queryResults,
    totalPages,
  };
};

type SearchUsersInput = {
  query: string;
  sortBy: "recent" | "alphabetical";
};

type SearchUsersOutput = {
  users: (User & {
    organizationUser: OrganizationUser | null;
  })[];
};

export const searchUsers: SearchUsers<
  SearchUsersInput,
  SearchUsersOutput
> = async ({ query, sortBy }, context) => {
  if (!context.user) {
    console.log(`[USERS] Unauthorized attempt to search users`);
    throw new HttpError(401, "Not authenticated");
  }

  // Get the user's organization and role
  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
    include: {
      organization: true,
    },
  });

  if (!organizationUser) {
    console.log(`[USERS] User ${context.user.id} attempted to search without organization membership`);
    throw new HttpError(403, "User is not part of an organization");
  }

  // Only allow organization owners to search users
  if (organizationUser.role !== "OWNER") {
    console.log(`[USERS] Non-owner user ${context.user.id} attempted to search users in org ${organizationUser.organizationId}`);
    throw new HttpError(403, "Only organization owners can search users");
  }

  console.log(`[USERS] Searching users in org ${organizationUser.organizationId} with query "${query}" sorted by ${sortBy}`);

  // Search for users in the same organization
  const users = await context.entities.User.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      organizations: {
        some: {
          organizationId: organizationUser.organizationId,
        },
      },
    },
    include: {
      organizations: {
        where: {
          organizationId: organizationUser.organizationId,
        },
      },
    },
    orderBy:
      sortBy === "recent" ? { lastActiveTimestamp: "desc" } : { name: "asc" },
  });

  // Transform the results to match the expected output type
  return {
    users: users.map((user) => ({
      ...user,
      organizationUser: user.organizations[0] || null,
    })),
  };
};

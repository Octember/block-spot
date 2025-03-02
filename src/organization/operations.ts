import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  Invitation,
  OnboardingState,
  Organization,
  OrganizationTag,
  OrganizationUser,
  OrganizationUserTag,
  User,
  Venue,
} from "wasp/entities";
import { HttpError } from "wasp/server";
import {
  AcceptInvitation,
  CancelInvitation,
  CreateInvitation,
  CreateOrganization,
  GetUserOrganizations,
  UpdateMemberRole,
  UpdateOnboardingState,
  type GetUserOrganization,
  ListInvitations,
  GetInvitationDetails,
  GetUserOrganizationRole,
} from "wasp/server/operations";
import { createSession } from "wasp/auth/session";
import { sendInvitationEmail } from "./email";
import { sendSlackMessage } from "../utils/slack-webhook";
import { createProviderId, createUser } from "wasp/auth/utils";

type CreateInvitationInput = {
  email: string;
  organizationId: string;
  role: "OWNER" | "MEMBER";
};

type CancelInvitationInput = {
  invitationId: string;
  organizationId: string;
};

type UpdateMemberRoleInput = {
  organizationId: string;
  userId: string;
  role: "OWNER" | "MEMBER";
};

type AcceptInvitationInput = {
  token: string;
};

type ListInvitationsInput = {
  organizationId: string;
};

type GetUserOrganizationResponse =
  | (Organization & {
      users: (OrganizationUser & {
        user: User;
        tags: (OrganizationUserTag & {
          organizationTag: OrganizationTag;
        })[];
      })[];
      onboardingState: OnboardingState | null;
      venues: Venue[];
    })
  | null;

type GetInvitationDetailsInput = {
  token: string;
};

type CreateOrganizationInput = {
  name: string;
  type: string;
  teamSize: string;
};

type UpdateOnboardingStateInput = {
  organizationId: string;
  updates: Partial<
    Pick<
      OnboardingState,
      | "hasCompletedProfile"
      | "hasSelectedPlan"
      | "hasInvitedMembers"
      | "hasCompletedOnboarding"
    >
  >;
};

export const getUserOrganizations: GetUserOrganizations<
  void,
  (Organization & {
    users: OrganizationUser[];
    venues: Venue[];
  })[]
> = async (_args, context) => {
  if (!context.user) {
    console.log(`[ORGS] Unauthorized attempt to get user organizations`);
    throw new HttpError(401);
  }

  console.log(`[ORGS] Fetching organizations for user ${context.user.id}`);

  const organizations = await context.entities.Organization.findMany({
    where: {
      users: { some: { userId: context.user.id } },
    },
    include: {
      users: {
        where: {
          userId: context.user.id,
        },
      },
      venues: true,
    },
  });

  return organizations;
};

export const getUserOrganization: GetUserOrganization<
  void,
  GetUserOrganizationResponse
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const organization = await context.entities.Organization.findFirst({
    where: {
      users: {
        some: {
          userId: context.user.id,
        },
      },
    },
    include: {
      users: {
        include: {
          user: true,
          tags: {
            include: {
              organizationTag: true,
            },
          },
        },
      },
      onboardingState: true,
      venues: true,
    },
  });

  if (!organization) {
    return null;
  }

  return organization;
};

export const createInvitation: CreateInvitation<
  CreateInvitationInput,
  Invitation
> = async (args, context) => {
  if (!context.user) {
    console.log(
      `[ORGS] Unauthorized attempt to create invitation for org ${args.organizationId}`,
    );
    throw new HttpError(401, "Not authorized");
  }

  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id, role: "OWNER" },
        include: {
          user: true,
        },
      },
    },
  });

  if (!organization || organization.users.length === 0) {
    console.log(
      `[ORGS] Non-owner user ${context.user.id} attempted to create invitation for org ${args.organizationId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to invite users to this organization",
    );
  }

  // Only check for existing user/invitation if an email is provided
  if (args.email) {
    // Check if user is already a member
    const existingUser = await context.entities.User.findUnique({
      where: { email: args.email },
      include: {
        organizations: {
          where: { organizationId: args.organizationId },
        },
      },
    });

    if (
      existingUser?.organizations?.length &&
      existingUser.organizations.length > 0
    ) {
      console.log(
        `[ORGS] Attempted to invite existing member ${args.email} to org ${args.organizationId}`,
      );
      throw new HttpError(400, "User is already a member of this organization");
    }

    // Check for existing pending invitation
    const existingInvitation = await context.entities.Invitation.findFirst({
      where: {
        email: args.email,
        organizationId: args.organizationId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      console.log(
        `[ORGS] Attempted to create duplicate invitation for ${args.email} in org ${args.organizationId}`,
      );
      throw new HttpError(400, "Invitation already exists for this email");
    }
  }

  console.log(
    `[ORGS] Creating invitation for ${args.email} with role ${args.role} in org ${args.organizationId}`,
  );

  const existingUser = await context.entities.User.findUnique({
    where: { email: args.email },
  });

  if (existingUser) {
    throw new HttpError(400, "User already exists");
  }

  const providerId = createProviderId("email", args.email);

  // Create shadow user with temp password
  const user = await createUser(
    providerId,
    JSON.stringify({ email: args.email }),
    {
      email: args.email,
    },
  );

  const token = uuidv4();
  const expiresAt = addDays(new Date(), 7); // Token expires in 7 days

  const invitation = await context.entities.Invitation.create({
    data: {
      email: args.email || "",
      role: args.role,
      organizationId: args.organizationId,
      invitedById: context.user.id,
      userId: user.id,
      token,
      expiresAt,
      status: "PENDING",
    },
  });

  if (args.email) {
    await sendInvitationEmail({
      email: args.email,
      inviterName: organization.users[0].user.email!, // Using email as name for now
      organizationName: organization.name,
      role: args.role,
      token,
      expiresAt,
    });
  }

  return invitation;
};

export const acceptInvitation: AcceptInvitation<
  AcceptInvitationInput,
  { invitation: Invitation; sessionId: string }
> = async (args, context) => {
  const invitation = await context.entities.Invitation.findUnique({
    where: { token: args.token },
    include: {
      organization: true,
      user: {
        include: {
          auth: true,
        },
      },
    },
  });

  if (!invitation) {
    console.log(
      `[ORGS] Attempted to accept invalid invitation token: ${args.token}`,
    );
    throw new HttpError(404, "Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    console.log(
      `[ORGS] Attempted to accept ${invitation.status} invitation: ${args.token}`,
    );
    throw new HttpError(400, "Invitation is no longer valid");
  }

  if (invitation.expiresAt < new Date()) {
    console.log(`[ORGS] Attempted to accept expired invitation: ${args.token}`);
    await context.entities.Invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new HttpError(400, "Invitation has expired");
  }

  console.log(
    `[ORGS] Accepting invitation ${invitation.id} for org ${invitation.organizationId}`,
  );

  const invitationAuthId = invitation.user?.auth?.id;
  if (!invitation.userId || !invitationAuthId) {
    throw new HttpError(
      400,
      "Something went wrong, missing userID: " +
        JSON.stringify(invitation.user),
    );
  }

  // Create organization membership
  await context.entities.OrganizationUser.create({
    data: {
      userId: invitation.userId,
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  });

  // Update invitation status
  await context.entities.Invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  // Create session
  const session = await createSession(invitationAuthId);

  return {
    invitation,
    sessionId: session.id,
  };
};

export const listInvitations: ListInvitations<
  ListInvitationsInput,
  Invitation[]
> = async (args, context) => {
  if (!context.user) {
    console.log(
      `[ORGS] Unauthorized attempt to list invitations for org ${args.organizationId}`,
    );
    throw new HttpError(401, "Not authorized");
  }

  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id },
      },
    },
  });

  if (!organization || organization.users.length === 0) {
    console.log(
      `[ORGS] User ${context.user.id} attempted to view invitations for unauthorized org ${args.organizationId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to view invitations for this organization",
    );
  }

  return context.entities.Invitation.findMany({
    where: {
      organizationId: args.organizationId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
};

export const cancelInvitation: CancelInvitation<
  CancelInvitationInput,
  Invitation
> = async (args, context) => {
  if (!context.user) {
    console.log(
      `[ORGS] Unauthorized attempt to cancel invitation ${args.invitationId}`,
    );
    throw new HttpError(401, "Not authorized");
  }

  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id, role: "OWNER" },
      },
    },
  });

  if (!organization || organization.users.length === 0) {
    console.log(
      `[ORGS] Non-owner user ${context.user.id} attempted to cancel invitation ${args.invitationId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to cancel invitations for this organization",
    );
  }

  const invitation = await context.entities.Invitation.findUnique({
    where: { id: args.invitationId },
  });

  if (!invitation || invitation.organizationId !== args.organizationId) {
    console.log(
      `[ORGS] Invalid invitation cancellation attempt: ${args.invitationId} for org ${args.organizationId}`,
    );
    throw new HttpError(404, "Invitation not found");
  }

  console.log(
    `[ORGS] Cancelling invitation ${args.invitationId} in org ${args.organizationId}`,
  );
  return context.entities.Invitation.update({
    where: { id: args.invitationId },
    data: { status: "CANCELLED" },
  });
};

export const updateMemberRole: UpdateMemberRole<
  UpdateMemberRoleInput,
  OrganizationUser
> = async (args, context) => {
  if (!context.user) {
    console.log(
      `[ORGS] Unauthorized attempt to update member role in org ${args.organizationId}`,
    );
    throw new HttpError(401, "Not authorized");
  }

  // Verify the current user is an owner
  const currentUserOrganization =
    await context.entities.OrganizationUser.findFirst({
      where: {
        userId: context.user.id,
        organizationId: args.organizationId,
        role: "OWNER",
      },
    });

  if (!currentUserOrganization) {
    console.log(
      `[ORGS] Non-owner user ${context.user.id} attempted to update roles in org ${args.organizationId}`,
    );
    throw new HttpError(403, "Only owners can update member roles");
  }

  console.log(
    `[ORGS] Updating role for user ${args.userId} to ${args.role} in org ${args.organizationId}`,
  );

  // Check if target user exists in organization
  const targetMembership = await context.entities.OrganizationUser.findFirst({
    where: {
      organizationId: args.organizationId,
      userId: args.userId,
    },
  });

  if (!targetMembership) {
    throw new HttpError(404, "Member not found");
  }

  // Prevent removing the last owner
  if (targetMembership.role === "OWNER" && args.role === "MEMBER") {
    const ownerCount = await context.entities.OrganizationUser.count({
      where: {
        organizationId: args.organizationId,
        role: "OWNER",
      },
    });

    if (ownerCount <= 1) {
      throw new HttpError(400, "Cannot remove the last owner");
    }
  }

  return context.entities.OrganizationUser.update({
    where: {
      id: targetMembership.id,
    },
    data: {
      role: args.role,
    },
  });
};

export const getInvitationDetails: GetInvitationDetails<
  GetInvitationDetailsInput,
  {
    organizationName: string;
    inviterName: string | null;
    role: string;
    email: string;
  }
> = async (args, context) => {
  const invitation = await context.entities.Invitation.findUnique({
    where: { token: args.token },
    include: {
      organization: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    throw new HttpError(404, "Invitation not found");
  }

  if (invitation.status !== "PENDING") {
    throw new HttpError(400, "Invitation is no longer valid");
  }

  if (invitation.expiresAt < new Date()) {
    await context.entities.Invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    throw new HttpError(400, "Invitation has expired");
  }

  return {
    organizationName: invitation.organization.name,
    inviterName: invitation.invitedBy.email,
    role: invitation.role,
    email: invitation.email,
  };
};

export const createOrganization: CreateOrganization<
  CreateOrganizationInput,
  Organization
> = async (args, context) => {
  if (!context.user) {
    console.log(`[ORGS] Unauthorized attempt to create organization`);
    throw new HttpError(401, "Not authorized");
  }

  console.log(
    `[ORGS] Creating new organization "${args.name}" of type ${args.type} for user ${context.user.id}`,
  );

  // Create the organization
  const organization = await context.entities.Organization.create({
    data: {
      name: args.name,
      type: args.type,
      // teamSize: args.teamSize,
      users: {
        create: {
          userId: context.user.id,
          role: "OWNER",
        },
      },
      tags: {
        create: [{ name: "Staff" }, { name: "Member" }],
      },
    },
  });

  await sendSlackMessage(
    `🎉🎉🎉 New organization created: ${organization.name} \nby ${context.user.email}`,
  );

  return organization;
};

export const updateOnboardingState: UpdateOnboardingState<
  UpdateOnboardingStateInput,
  OnboardingState
> = async (args, context) => {
  if (!context.user) {
    console.log(
      `[ORGS] Unauthorized attempt to update onboarding state for org ${args.organizationId}`,
    );
    throw new HttpError(401, "Not authorized");
  }

  // Check if user is a member of the organization
  const membership = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
      organizationId: args.organizationId,
    },
  });

  if (!membership) {
    console.log(
      `[ORGS] User ${context.user.id} attempted to update onboarding state for unauthorized org ${args.organizationId}`,
    );
    throw new HttpError(
      403,
      "Not authorized to update this organization's onboarding state",
    );
  }

  // Get or create onboarding state
  let onboardingState = await context.entities.OnboardingState.findUnique({
    where: { organizationId: args.organizationId },
  });

  if (!onboardingState) {
    console.log(
      `[ORGS] Creating initial onboarding state for org ${args.organizationId}`,
    );
    onboardingState = await context.entities.OnboardingState.create({
      data: {
        organizationId: args.organizationId,
      },
    });
  }

  console.log(
    `[ORGS] Updating onboarding state for org ${args.organizationId}: ${JSON.stringify(args.updates)}`,
  );
  // Update onboarding state
  return context.entities.OnboardingState.update({
    where: { organizationId: args.organizationId },
    data: args.updates,
  });
};

export const getUserOrganizationRole: GetUserOrganizationRole<
  void,
  {
    role: string;
    organizationId: string;
  } | null
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(403);
  }

  const organizationUser = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
    },
    select: {
      role: true,
      organizationId: true,
    },
  });

  return organizationUser;
};

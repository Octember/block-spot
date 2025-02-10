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
} from "wasp/entities";
import { HttpError } from "wasp/server";
import {
  UpdateOnboardingState,
  type GetUserOrganization,
} from "wasp/server/operations";
import { sendInvitationEmail } from "./email";

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
    },
  });

  if (!organization) {
    return null;
  }

  return organization;
};

export const createInvitation = async (
  args: CreateInvitationInput,
  context: any,
) => {
  if (!context.user) {
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

    if (existingUser?.organizations.length > 0) {
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
      throw new HttpError(400, "Invitation already exists for this email");
    }
  }

  const expiresAt = addDays(new Date(), 7); // Invitation expires in 7 days
  const token = uuidv4();

  const invitation = await context.entities.Invitation.create({
    data: {
      email: args.email || "", // Store empty string for open invitations
      role: args.role,
      organizationId: args.organizationId,
      invitedById: context.user.id,
      token,
      expiresAt,
      status: "PENDING",
    },
  });

  // Only send email if an email address was provided
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

export const acceptInvitation = async (
  args: AcceptInvitationInput,
  context: any,
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authorized");
  }

  const invitation = await context.entities.Invitation.findUnique({
    where: { token: args.token },
    include: { organization: true },
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

  // For open invitations (no email), any logged-in user can accept
  // For email-specific invitations, verify the email matches
  if (invitation.email && invitation.email !== context.user.email) {
    throw new HttpError(
      403,
      "This invitation was sent to a different email address",
    );
  }

  // Check if user is already a member
  const existingMembership = await context.entities.OrganizationUser.findFirst({
    where: {
      userId: context.user.id,
      organizationId: invitation.organizationId,
    },
  });

  if (existingMembership) {
    throw new HttpError(400, "You are already a member of this organization");
  }

  // Create organization membership
  await context.entities.OrganizationUser.create({
    data: {
      userId: context.user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    },
  });

  // Update invitation status
  await context.entities.Invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  return invitation.organization;
};

export const listInvitations = async (
  args: ListInvitationsInput,
  context,
): Promise<Invitation[]> => {
  if (!context.user) {
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

export const cancelInvitation = async (
  args: CancelInvitationInput,
  context,
) => {
  if (!context.user) {
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
    throw new HttpError(
      403,
      "Not authorized to cancel invitations for this organization",
    );
  }

  const invitation = await context.entities.Invitation.findUnique({
    where: { id: args.invitationId },
  });

  if (!invitation || invitation.organizationId !== args.organizationId) {
    throw new HttpError(404, "Invitation not found");
  }

  return context.entities.Invitation.update({
    where: { id: args.invitationId },
    data: { status: "CANCELLED" },
  });
};

export const updateMemberRole = async (
  args: UpdateMemberRoleInput,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authorized");
  }

  // Check if current user is an owner
  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id, role: "OWNER" },
      },
    },
  });

  if (!organization || organization.users.length === 0) {
    throw new HttpError(403, "Not authorized to update member roles");
  }

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

export const getInvitationDetails = async (
  args: GetInvitationDetailsInput,
  context,
) => {
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

export const createOrganization = async (
  args: CreateOrganizationInput,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, "Not authorized");
  }

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
    },
  });

  return organization;
};

export const updateOnboardingState: UpdateOnboardingState<
  UpdateOnboardingStateInput,
  OnboardingState
> = async (args, context) => {
  if (!context.user) {
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
    onboardingState = await context.entities.OnboardingState.create({
      data: {
        organizationId: args.organizationId,
      },
    });
  }

  // Update onboarding state
  return context.entities.OnboardingState.update({
    where: { organizationId: args.organizationId },
    data: args.updates,
  });
};

export const getUserOrganizationRole = async (_args: void, context: any) => {
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

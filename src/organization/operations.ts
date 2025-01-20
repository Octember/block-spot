import { Invitation, Organization, OrganizationUser, User } from 'wasp/entities'
import { HttpError } from 'wasp/server'
import { v4 as uuidv4 } from 'uuid'
import { addDays } from 'date-fns'

type CreateInvitationInput = {
  email: string
  organizationId: string
  role: 'OWNER' | 'MEMBER'
}

type AcceptInvitationInput = {
  token: string
}

type ListInvitationsInput = {
  organizationId: string
}

type GetUserOrganizationsResponse = Organization & {
  users: (OrganizationUser & {
    user: User
  })[]
}

export const getUserOrganizations = async (_args: void, context: any): Promise<GetUserOrganizationsResponse[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  return context.entities.Organization.findMany({
    where: {
      users: {
        some: {
          userId: context.user.id
        }
      }
    },
    include: {
      users: {
        include: {
          user: true
        }
      }
    }
  })
}

export const createInvitation = async (args: CreateInvitationInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id, role: 'OWNER' }
      }
    }
  })

  if (!organization || organization.users.length === 0) {
    throw new HttpError(403, 'Not authorized to invite users to this organization')
  }

  // Check if user is already a member
  const existingUser = await context.entities.User.findUnique({
    where: { email: args.email },
    include: {
      organizations: {
        where: { organizationId: args.organizationId }
      }
    }
  })

  if (existingUser?.organizations.length > 0) {
    throw new HttpError(400, 'User is already a member of this organization')
  }

  // Check for existing pending invitation
  const existingInvitation = await context.entities.Invitation.findFirst({
    where: {
      email: args.email,
      organizationId: args.organizationId,
      status: 'PENDING'
    }
  })

  if (existingInvitation) {
    throw new HttpError(400, 'Invitation already exists for this email')
  }

  const invitation = await context.entities.Invitation.create({
    data: {
      email: args.email,
      role: args.role,
      organizationId: args.organizationId,
      invitedById: context.user.id,
      token: uuidv4(),
      expiresAt: addDays(new Date(), 7), // Invitation expires in 7 days
      status: 'PENDING'
    }
  })

  // TODO: Send invitation email
  
  return invitation
}

export const acceptInvitation = async (args: AcceptInvitationInput, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const invitation = await context.entities.Invitation.findUnique({
    where: { token: args.token },
    include: { organization: true }
  })

  if (!invitation) {
    throw new HttpError(404, 'Invitation not found')
  }

  if (invitation.status !== 'PENDING') {
    throw new HttpError(400, 'Invitation is no longer valid')
  }

  if (invitation.expiresAt < new Date()) {
    await context.entities.Invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    })
    throw new HttpError(400, 'Invitation has expired')
  }

  if (invitation.email !== context.user.email) {
    throw new HttpError(403, 'This invitation was sent to a different email address')
  }

  // Create organization membership
  await context.entities.OrganizationUser.create({
    data: {
      userId: context.user.id,
      organizationId: invitation.organizationId,
      role: invitation.role
    }
  })

  // Update invitation status
  await context.entities.Invitation.update({
    where: { id: invitation.id },
    data: { status: 'ACCEPTED' }
  })

  return invitation.organization
}

export const listInvitations = async (args: ListInvitationsInput, context: any): Promise<Invitation[]> => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized')
  }

  const organization = await context.entities.Organization.findUnique({
    where: { id: args.organizationId },
    include: {
      users: {
        where: { userId: context.user.id }
      }
    }
  })

  if (!organization || organization.users.length === 0) {
    throw new HttpError(403, 'Not authorized to view invitations for this organization')
  }

  return context.entities.Invitation.findMany({
    where: {
      organizationId: args.organizationId,
      status: 'PENDING'
    },
    orderBy: { createdAt: 'desc' }
  })
} 
import { HttpError } from "wasp/server";
import type { OnAfterSignupHook } from "wasp/server/auth";

export const onAfterSignup: OnAfterSignupHook = async ({
  providerId,
  user,
  prisma,
  req,
  // res
}) => {
  // TODO: Add onboarding flow here
  // res.redirect("/onboarding")

  // For Stripe to function correctly, we need a valid email associated with the user.
  // Discord allows an email address to be optional. If this is the case, we delete the user
  // from our DB and throw an error.
  if (providerId.providerName === "discord" && !user.email) {
    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });
    throw new HttpError(403, "Discord user needs a valid email to sign up");
  }

  // Handle organization invitation
  const invitationToken = req.body?.invitationToken;
  if (invitationToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: invitationToken },
      include: { organization: true },
    });

    if (!invitation) {
      throw new HttpError(404, "Invitation not found");
    }

    if (invitation.status !== "PENDING") {
      throw new HttpError(400, "Invitation is no longer valid");
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new HttpError(400, "Invitation has expired");
    }

    // For email-specific invitations, verify the email matches
    if (invitation.email && invitation.email !== user.email) {
      throw new HttpError(
        403,
        "This invitation was sent to a different email address"
      );
    }

    // Create organization membership
    await prisma.organizationUser.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });
  }
};

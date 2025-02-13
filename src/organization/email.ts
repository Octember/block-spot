import { ServerClient } from "postmark";
import { formatInTimeZone } from "date-fns-tz";

const postmarkClient = new ServerClient(process.env.POSTMARK_API_TOKEN!);

export async function sendInvitationEmail({
  email,
  inviterName,
  organizationName,
  role,
  token,
  expiresAt,
}: {
  email: string;
  inviterName: string;
  organizationName: string;
  role: "OWNER" | "MEMBER";
  token: string;
  expiresAt: Date;
}) {
  const acceptUrl = `${process.env.WASP_WEB_CLIENT_URL}/invitation/${token}`;
  const expirationDate = formatInTimeZone(expiresAt, "UTC", "MMMM do, yyyy");

  await postmarkClient.sendEmailWithTemplate({
    From: process.env.EMAIL_FROM!,
    To: email,
    TemplateAlias: "user-invitation",
    TemplateModel: {
      email,
      inviterName,
      organizationName,
      role: role.toLowerCase(),
      acceptUrl,
      expirationDate,
    },
  });
}

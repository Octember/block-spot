import { emailSender } from 'wasp/server/email'
import { getFrontendUrl } from 'wasp/src/payment/stripe/operations'

type SendInvitationEmailArgs = {
  email: string
  inviterName: string
  organizationName: string
  role: string
  token: string
  expiresAt: Date
}

export const sendInvitationEmail = async ({
  email,
  inviterName,
  organizationName,
  role,
  token,
  expiresAt,
}: SendInvitationEmailArgs) => {
  const inviteUrl = `${getFrontendUrl()}/invitation/${token}`
  
  console.log("Sending invite URL", inviteUrl)

  await emailSender.send({
    to: email,
    subject: `You've been invited to join ${organizationName} on BlockSpot`,
    text: `
      ${inviterName} has invited you to join ${organizationName} as a ${role.toLowerCase()}.
      
      Click here to accept the invitation and join the organization: ${inviteUrl}
      
      This invitation will expire on ${expiresAt.toLocaleDateString()}.
    `,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're invited to join ${organizationName}!</h2>
        
        <p>${inviterName} has invited you to join <strong>${organizationName}</strong> as a ${role.toLowerCase()}.</p>
        
        <p>Click the button below to join the organization:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Accept Invitation & Join
          </a>
        </div>
        
        <p style="color: #666; font-size: 0.9em;">
          This invitation will expire on ${expiresAt.toLocaleDateString()}.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 0.9em;">
          <p>
            No password needed! We use secure magic links for authentication.
            Just click the button above to automatically sign in and join the organization.
          </p>
        </div>
      </div>
    `
  })
}

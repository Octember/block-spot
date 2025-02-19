import { v4 as uuidv4 } from 'uuid';
import { createSession } from 'wasp/auth/session';
import { createProviderId, createUser, findAuthIdentity } from 'wasp/auth/utils';
import { emailSender } from 'wasp/server/email';
import { AuthenticateWithToken, CreateMagicLoginToken } from 'wasp/server/operations';
import { getFrontendUrl } from '../../payment/stripe/operations';
import { HttpError } from 'wasp/server';

const TOKEN_EXPIRY_HOURS = 24

export type MagicLoginTokenInput = {
  email: string
}

export type TokenAuthInput = {
  token: string
}

export type TokenAuthResponse = {
  sessionId: string
}


export const createMagicLoginToken: CreateMagicLoginToken<MagicLoginTokenInput, void> = async ({ email }, context)=> {

  const providerId = createProviderId('email', email)

  // Find or create user
  const existingUser = await context.entities.User.findUnique({ where: { email } })

  if (existingUser) {
    throw new HttpError(400, 'User already exists')
  }
  
  // Create shadow user with temp password
  const user = await createUser(
    providerId,
    JSON.stringify({ email }),
    {
      email,
    }
  )

  // Create magic token
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)  
  const token = uuidv4();

  await context.entities.MagicLoginToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt
    }
  })

  // Send magic link email
  const magicLink = `${getFrontendUrl()}/magic-login?token=${token}`

  console.log("?????? EMAIL", magicLink)
  
  await emailSender.send({
    to: email,
    subject: 'Your Magic Login Link',
    text: `Click here to login: ${magicLink}`,
    html: `
      <p>Click the button below to login:</p>
      <a href="${magicLink}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Login to BlockSpot
      </a>
    `
  })
}

export const authenticateWithToken: AuthenticateWithToken<TokenAuthInput, TokenAuthResponse> = async ({ token }, context) => {
  // Find and validate token
  const magicToken = await context.entities.MagicLoginToken.findUnique({
    where: { token },
    include: { user: {
      include: {
        auth: true
      }
    } }
  })

  const authId = magicToken?.user.auth?.id

  if (!magicToken || magicToken.used || magicToken.expiresAt < new Date() || !authId) {
    throw new HttpError(400, 'Invalid or expired token')
  }

  // Mark token as used
  await context.entities.MagicLoginToken.update({
    where: { id: magicToken.id },
    data: { used: true }
  })

  // Create session
  const session = await createSession(authId)
  return { sessionId: session.id }
} 
import React, { useEffect, useState } from 'react'
import { createMagicLoginToken, authenticateWithToken } from 'wasp/client/operations'
import { initSession } from 'wasp/auth/helpers/user'

export function MagicLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Check for token in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      handleTokenAuth(token)
    }
  }, [])

  const handleTokenAuth = async (token: string) => {
    try {
      setIsLoading(true)
      const { sessionId } = await authenticateWithToken({ token })
      console.log('sessionId', sessionId)
      await initSession(sessionId)
      // await createSession(sessionId)
      // history.push('/venues') // Redirect to main app
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsLoading(true)
      setError(null)
      await createMagicLoginToken({ email })
      setEmailSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send login link')
    } finally {
      setIsLoading(false)
    }
  }

  initSession

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (emailSent) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Check Your Email</h2>
        <p className="text-gray-600 text-center">
          We've sent a magic login link to {email}. Click the link in the email to log in.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Magic Login</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Send Magic Link
        </button>
      </form>

    </div>
  )
} 
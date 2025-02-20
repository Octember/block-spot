import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getInvitationDetails, acceptInvitation } from 'wasp/client/operations'
import { useQuery } from 'wasp/client/operations'
import { Link } from "wasp/client/router"
import { routes } from "wasp/client/router"
import { initSession } from 'wasp/auth/helpers/user'
import "../auth/overrides.css";

export function InvitationPage() {
  const { token } = useParams<{ token: string }>()
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    data: details,
    isLoading,
    error: queryError
  } = useQuery(getInvitationDetails, {
    token: token || ''
  })

  const handleAcceptInvitation = async () => {
    if (!token) return

    try {
      setIsAccepting(true)
      setError(null)
      const { sessionId } = await acceptInvitation({ token })

      // Initialize session and redirect to app
      await initSession(sessionId)
      window.location.href = routes.AccountRoute.to
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="centered-page-content">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (queryError || error) {
    return (
      <div className="centered-page-content">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Invitation Error</h2>
          <p className="text-gray-600 mb-4">{queryError?.message || error}</p>
          <Link
            to={routes.LoginRoute.to}
            className="text-blue-600 hover:text-blue-800"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!details) return null

  return (
    <div className="centered-page-content">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Join {details.organizationName}
        </h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            <span className="font-medium">{details.inviterName}</span> has invited you to join{' '}
            <span className="font-medium">{details.organizationName}</span> as a{' '}
            <span className="font-medium">{details.role.toLowerCase()}</span>.
          </p>

          {details.email && (
            <p className="text-sm text-gray-500">
              This invitation was sent to {details.email}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleAcceptInvitation}
            disabled={isAccepting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAccepting ? 'Joining...' : 'Accept & Join'}
          </button>

          <p className="text-sm text-gray-500 text-center">
            By accepting this invitation, you&apos;ll be automatically signed in to your account.
          </p>
        </div>
      </div>
    </div>
  )
}

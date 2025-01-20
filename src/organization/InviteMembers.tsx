import React, { useState } from 'react'
import { createInvitation } from 'wasp/client/operations'

type InviteMembersProps = {
  organizationId: string
}

export function InviteMembers({ organizationId }: InviteMembersProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleGenerateLink = async () => {
    setIsLoading(true)
    setError(null)
    setShowSuccess(false)

    try {
      const invitation = await createInvitation({
        email: '', // Empty email for open invitations
        organizationId,
        role: 'MEMBER'
      })

      const inviteLink = `${window.location.origin}/invitation/${invitation.token}`
      await navigator.clipboard.writeText(inviteLink)

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to create invitation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-medium text-gray-900'>Team Invitations</h3>
        <button
          type='button'
          onClick={handleGenerateLink}
          disabled={isLoading}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? (
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
          ) : (
            'Generate Invite Link'
          )}
        </button>
      </div>

      {error && (
        <div className='rounded-md bg-red-50 p-4'>
          <div className='flex'>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>{error}</h3>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className='rounded-md bg-green-50 p-4'>
          <div className='flex'>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-green-800'>
                Invitation link copied to clipboard!
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
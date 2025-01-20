import { useQuery } from 'wasp/client/operations'
import { listInvitations, getUserOrganizations, createInvitation } from 'wasp/client/operations'
import type { Organization, OrganizationUser, User, Invitation } from 'wasp/entities'
import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Modal } from '../client/components/modal'
import { Button } from '../client/components/button'
import { useToast } from '../client/toast'

type InviteMemberFormInputs = {
  email: string
  role: 'OWNER' | 'MEMBER'
}

function InviteMemberButton({ organizationId }: { organizationId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const toast = useToast()

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        ariaLabel="Invite Member"
      >
        Invite Member
      </Button>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className='space-y-4'>
          <h3 className='text-lg font-medium leading-6 text-gray-900'>
            Invite New Member
          </h3>
          <InviteMemberForm
            organizationId={organizationId}
            onSuccess={(email) => {
              setIsModalOpen(false)
              toast({
                title: 'Invitation sent',
                description: `Invitation sent to ${email}`
              })
            }}
          />
        </div>
      </Modal>
    </>
  )
}

function InviteMemberForm({
  organizationId,
  onSuccess
}: {
  organizationId: string,
  onSuccess: (email: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<InviteMemberFormInputs>({
    defaultValues: {
      email: '',
      role: 'MEMBER'
    }
  })

  const onSubmit: SubmitHandler<InviteMemberFormInputs> = async (data) => {
    setError(null)
    try {
      await createInvitation({
        email: data.email,
        organizationId,
        role: data.role
      })
      reset()
      onSuccess(data.email)
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      {error && (
        <div className='bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm'>
          {error}
        </div>
      )}

      <div>
        <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
          Email Address
        </label>
        <input
          {...register('email', { required: true })}
          type='email'
          id='email'
          className='mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
        />
      </div>

      <div>
        <label htmlFor='role' className='block text-sm font-medium text-gray-700'>
          Role
        </label>
        <select
          {...register('role')}
          id='role'
          className='mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm'
        >
          <option value='MEMBER'>Member</option>
          <option value='OWNER'>Owner</option>
        </select>
      </div>

      <div className='mt-5 sm:mt-6'>
        <Button
          type='submit'
          disabled={isSubmitting}
          ariaLabel="Send Invitation"
        >
          {isSubmitting ? 'Sending...' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  )
}

export function OrganizationSection() {
  const { data: organizations, isLoading, error } = useQuery(getUserOrganizations)
  const { data: invitations } = useQuery(listInvitations, {
    organizationId: organizations?.[0]?.id ?? ''
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!organizations?.length) return <div>No organizations found.</div>

  const organization = organizations[0] // For now, just show the first org

  return (
    <div className='space-y-6'>
      <div>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold'>Organization</h2>
          <InviteMemberButton organizationId={organization.id} />
        </div>
        <div className='bg-white shadow rounded-lg p-6'>
          <h3 className='text-lg font-semibold'>{organization.name}</h3>
          <p className='text-gray-500 text-sm'>Created {new Date(organization.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div>
        <h3 className='text-xl font-bold mb-4'>Members</h3>
        <div className='bg-white shadow rounded-lg overflow-hidden'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>User</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Role</th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Joined</th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {organization.users.map((member) => (
                <tr key={member.user.id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{member.user.email}</div>
                        <div className='text-sm text-gray-500'>{member.user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${member.role === 'OWNER' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {new Date(member.user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {invitations && invitations.length > 0 && (
        <div>
          <h3 className='text-xl font-bold mb-4'>Pending Invitations</h3>
          <div className='bg-white shadow rounded-lg overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Email</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Role</th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Expires</th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>{invitation.email}</td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.role === 'OWNER' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {invitation.role}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 
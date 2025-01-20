import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  cancelInvitation,
  getUserOrganization,
  listInvitations,
  updateMemberRole,
  useQuery,
} from "wasp/client/operations";
import { useToast } from "../client/toast";
import { InviteMemberButton } from "./components/invite-member-form";
import { RoleSelect } from "./components/role-select";
import { InviteMembers } from "./InviteMembers";

export function OrganizationSection() {
  const toast = useToast();
  const {
    data: organization,
    isLoading,
    error,
  } = useQuery(getUserOrganization);
  const { data: invitations } = useQuery(listInvitations, {
    organizationId: organization?.id ?? "",
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!organization) return <div>No organization found.</div>;

  const isOwner = organization.users.some(
    (member) =>
      member.user.id === organization.users[0].user.id &&
      member.role === "OWNER",
  );

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation({
        invitationId,
        organizationId: organization.id,
      });
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to cancel invitation",
        description: err.message || "Please try again",
      });
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "OWNER" | "MEMBER",
  ) => {
    await updateMemberRole({
      organizationId: organization.id,
      userId,
      role: newRole,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Organization</h2>
          {isOwner && (
            <div className="flex gap-2">
              <InviteMemberButton organizationId={organization.id} />

              <InviteMembers organizationId={organization.id} />
            </div>
          )}
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold">{organization.name}</h3>
          <p className="text-gray-500 text-sm">
            Created {new Date(organization.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Members</h3>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organization.users.map((member) => (
                <tr key={member.user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleSelect
                      currentRole={member.role}
                      isOwner={isOwner}
                      onUpdateRole={(newRole) =>
                        handleUpdateRole(member.user.id, newRole)
                      }
                      disabled={
                        member.user.id === organization.users[0].user.id
                      } // Can't change own role
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <h3 className="text-xl font-bold mb-4">Pending Invitations</h3>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  {isOwner && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.role === "OWNER" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

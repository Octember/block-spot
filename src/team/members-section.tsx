import { XMarkIcon } from "@heroicons/react/20/solid";
import { useMemo } from "react";
import {
  cancelInvitation,
  getOrganizationTags,
  getUserOrganization,
  listInvitations,
  updateMemberRole,
  updateUserTags,
  useQuery,
} from "wasp/client/operations";
import LoadingSpinner from "../admin/layout/LoadingSpinner";
import { useAuthUser } from "../auth/providers/AuthUserProvider";
import { cn } from "../client/cn";
import { Card } from "../client/components/card";
import { MultiSelect } from "../client/components/form/select";
import { useToast } from "../client/toast";
import { RoleSelect } from "./role-select";

export function MembersSection() {
  const toast = useToast();
  const {
    data: organization,
    isLoading,
    error,
  } = useQuery(getUserOrganization);
  const { isOwner } = useAuthUser();
  const { data: tags } = useQuery(getOrganizationTags, {
    organizationId: organization?.id ?? "",
  });

  const { data: invitations } = useQuery(listInvitations, {
    organizationId: organization?.id ?? "",
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;
  if (!organization) return <div>No organization found.</div>;

  const tagOptions = useMemo(
    () =>
      tags?.map((tag) => ({
        label: tag.name,
        value: tag.id,
      })) || [],
    [tags],
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
      <h3 className="text-xl font-bold mb-4">Members</h3>
      <table
        className={cn(
          "min-w-full divide-y divide-gray-200 shadow rounded-lg overflow-hidden",
        )}
      >
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Joined
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 rounded">
          {organization.users.map((member) => (
            <tr key={member.user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.user.email}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.user.name}
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
                  disabled={member.user.id === organization.users[0].user.id} // Can't change own role
                />
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {(!tags || tags?.length === 0) && <span>No tags set</span>}
                {tags && tags?.length > 0 && (
                  <MultiSelect
                    options={tagOptions}
                    value={tagOptions.filter((tag) =>
                      member.tags.some(
                        (t) => t.organizationTag.id === tag.value,
                      ),
                    )}
                    onChange={(value) => {
                      updateUserTags({
                        userId: member.user.id,
                        tagIds: [
                          ...new Set(value.map((tag) => tag.value as string)),
                        ],
                      });
                    }}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(member.user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
                    Status
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
                      {invitation.email || (
                        <span className="text-gray-500">{"<Copied URL>"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invitation.role === "OWNER" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full `}
                      >
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner && (
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                      {/* {invitation.status === "PENDING" && (
                        <button
                          onClick={() => handleCopyInvitationLink(invitation.)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Copy link
                        </button>
                      )} */}
                    </td>
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

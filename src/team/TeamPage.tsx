import { SidebarLayout } from "../client/components/layouts/sidebar-layout";
import { OrganizationSection } from "../organization/organization-section";
import { InviteMemberButton } from "../organization/components/invite-member-form";
import { InviteMembers } from "../organization/InviteMembers";
import { useQuery, getUserOrganization } from "wasp/client/operations";

export default function TeamPage() {
  const { data: organization, isLoading } = useQuery(getUserOrganization);

  if (!organization) return <div>No organization found.</div>;

  const isOwner = organization.users.some(
    (member) =>
      member.user.id === organization.users[0].user.id &&
      member.role === "OWNER",
  );

  return (
    <SidebarLayout
      header={{
        title: "Team",
        description: "Manage your team members and their roles",
        actions: isOwner ? (
          <div className="flex gap-2">
            <InviteMemberButton organizationId={organization.id} />
            <InviteMembers organizationId={organization.id} />
          </div>
        ) : null,
      }}
    >
      <OrganizationSection />
    </SidebarLayout>
  );
}

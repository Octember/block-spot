import { SidebarLayout } from "../client/components/layouts/sidebar-layout";
import { MembersSection } from "./members-section";
import { InviteMemberButton } from "../organization/components/invite-member-form";
import { InviteMembers } from "../organization/InviteMembers";
import { useQuery, getUserOrganization } from "wasp/client/operations";
import { ManageTagsButton } from "./manage-tags-button";
import { AuthUserProvider } from '../auth/providers/AuthUserProvider';
import { AuthUser } from "wasp/auth";

export default function TeamPage({ user }: { user: AuthUser }) {
  const { data: organization } = useQuery(getUserOrganization);

  if (!organization) return <div>No organization found.</div>;

  const isOwner = organization.users.some(
    (member) =>
      member.user.id === organization.users[0].user.id &&
      member.role === "OWNER",
  );

  return (
    <SidebarLayout
      user={user}
      header={{
        title: "Team",
        description: "Manage your team members and their roles",
        actions: isOwner ? (
          <div className="flex gap-2">
            <ManageTagsButton />
            <InviteMemberButton organizationId={organization.id} />
            <InviteMembers organizationId={organization.id} />
          </div>
        ) : null,
      }}
    >
      <MembersSection />
    </SidebarLayout>
  );
}

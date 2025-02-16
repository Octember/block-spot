import { getUserOrganization, useQuery } from "wasp/client/operations";
import { SidebarLayout } from "../client/components/layouts/sidebar-layout";
import { InviteMemberButton } from "../organization/components/invite-member-form";
import { InviteMembers } from "../organization/InviteMembers";
import { ManageTagsButton } from "./manage-tags-button";
import { MembersSection } from "./members-section";

export default function TeamPage() {
  const { data: organization } = useQuery(getUserOrganization);

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

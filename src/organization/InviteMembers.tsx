import { useState } from "react";
import { createInvitation } from "wasp/client/operations";
import { useToast } from "../client/toast";
import { Button } from "../client/components/button";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { useAuthUser } from "../auth/providers/AuthUserProvider";

type InviteMembersProps = {
  organizationId: string;
};

export function InviteMembers({ organizationId }: InviteMembersProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isOwner } = useAuthUser();

  const toast = useToast();

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const invitation = await createInvitation({
        email: "", // Empty email for open invitations
        organizationId,
        role: "MEMBER",
      });

      const inviteLink = `${window.location.origin}/invitation/${invitation.token}`;
      await navigator.clipboard.writeText(inviteLink);

      toast({
        title: "Invitation link copied to clipboard!",
        description:
          "You can now share this link with your team members to join your organization.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create invitation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <Button
        onClick={handleGenerateLink}
        disabled={isLoading || !isOwner}
        ariaLabel="Generate Invite Link"
        icon={<ArrowUpOnSquareIcon className="size-4" />}
        variant="secondary"
      >
        Generate Invite Link
      </Button>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

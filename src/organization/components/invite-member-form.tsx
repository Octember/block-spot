import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { createInvitation } from "wasp/client/operations";
import { Modal } from "../../client/components/modal";
import { Button } from "../../client/components/button";
import { useToast } from "../../client/toast";
import { UserPlusIcon } from "@heroicons/react/24/outline";

type InviteMemberFormInputs = {
  email: string;
  role: "OWNER" | "MEMBER";
};

export function InviteMemberButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        ariaLabel="Invite Member"
        variant="secondary"
        icon={<UserPlusIcon className="size-4" />}
      >
        Invite Member
      </Button>
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        heading={{
          title: "Invite New Member",
          description: "Invite a new member to your organization",
        }}
      >
        <InviteMemberForm
          organizationId={organizationId}
          onSuccess={(email) => {
            setIsModalOpen(false);
            toast({
              title: "Invitation sent",
              description: `Invitation sent to ${email}`,
            });
          }}
        />
      </Modal>
    </>
  );
}

function InviteMemberForm({
  organizationId,
  onSuccess,
}: {
  organizationId: string;
  onSuccess: (email: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<InviteMemberFormInputs>({
    defaultValues: {
      email: "",
      role: "MEMBER",
    },
  });

  const onSubmit: SubmitHandler<InviteMemberFormInputs> = async (data) => {
    setError(null);
    try {
      await createInvitation({
        email: data.email,
        organizationId,
        role: data.role,
      });
      reset();
      onSuccess(data.email);
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          {...register("email", { required: true })}
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Role
        </label>
        <select
          {...register("role")}
          id="role"
          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          <option value="MEMBER">Member</option>
          <option value="OWNER">Owner</option>
        </select>
      </div>

      <div className="mt-5 sm:mt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          ariaLabel="Send Invitation"
        >
          {isSubmitting ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}

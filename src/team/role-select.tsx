import { useState } from "react";
import * as React from "react";
import { useToast } from "../client/toast";

type RoleSelectProps = {
  currentRole: "OWNER" | "MEMBER";
  isOwner: boolean;
  onUpdateRole: (newRole: "OWNER" | "MEMBER") => Promise<void>;
  disabled?: boolean;
};

export function RoleSelect({
  currentRole,
  isOwner,
  onUpdateRole,
  disabled,
}: RoleSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as "OWNER" | "MEMBER";
    if (newRole === currentRole) return;

    setIsUpdating(true);
    try {
      await onUpdateRole(newRole);
      toast({
        title: "Role updated",
        description: `Member role updated to ${newRole.toLowerCase()}`,
      });
    } catch (err: any) {
      toast({
        type: "error",
        title: "Failed to update role",
        description: err.message || "Please try again",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={disabled || isUpdating || !isOwner}
      className={`pl-2 pr-6 py-1 text-xs font-semibold rounded-full 
        ${currentRole === "OWNER" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
        ${isOwner ? "cursor-pointer" : "cursor-not-allowed"}
        disabled:opacity-50`}
    >
      <option value="MEMBER">Member</option>
      <option value="OWNER">Owner</option>
    </select>
  );
}

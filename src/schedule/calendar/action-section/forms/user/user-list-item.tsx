import { LuCheck } from "react-icons/lu";
import { UserAvatar } from "../../../../../client/components/user-avatar";
import { UserListItemProps } from "./types";

export const UserListItem = ({ user, selected, onSelect }: UserListItemProps) => {
  return (
    <li className={`flex rounded-md hover:bg-sky-100 ${selected
      ? "border-2 border-sky-600 bg-sky-600/10 box-content"
      : "border-2 border-gray-200"
      }`}>
      <button
        type="button"
        className="flex flex-row gap-x-4 items-center p-2   rounded-md hover:bg-gray-100 w-full"
        onClick={() => onSelect?.(user)}
      >
        <UserAvatar user={user} size="sm" />

        <div className="flex flex-grow flex-col items-start">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-sm font-normal text-gray-500">{user.email}</span>
        </div>

        {selected && <LuCheck className="size-7 text-white bg-sky-600 p-0.5 rounded-full" />}
      </button>
    </li>
  );
} 
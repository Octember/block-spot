import { LuCheck } from "react-icons/lu";
import { UserAvatar } from "../../../../../client/components/user-avatar";
import { UserListItemProps } from "./types";

export const UserListItem = ({ user, selected }: UserListItemProps) => {
  return (
    <li className={`flex rounded-md hover:bg-gray-100 ${selected ? " border border-gray-400 bg-sky-600/10" : ""} `}>
      <button type="button" className="flex flex-row gap-x-4 items-center p-2 rounded-md hover:bg-gray-100 w-full">
        <UserAvatar user={user} size="sm" />

        <div className="flex flex-grow flex-col items-start">
          <span className="text-sm font-semibold">{user.name}</span>
          <span className="text-sm font-normal text-gray-500">{user.email}</span>
        </div>

        {selected && <LuCheck className="size-6 text-sky-600" />}
      </button>
    </li>
  );
} 
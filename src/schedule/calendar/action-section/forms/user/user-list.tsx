import { BiLoaderCircle } from "react-icons/bi";
import { LuSearch } from "react-icons/lu";
import { User } from "./types";
import { UserListItem } from "./user-list-item";

interface UserListProps {
  users: User[];
  noResults: boolean;
  isLoading?: boolean;
  selectedUserId?: string;
  onUserSelect?: (user: User) => void;
}

export const UserList = ({
  users,
  noResults,
  isLoading,
  selectedUserId,
  onUserSelect,
}: UserListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-y-2 p-4 rounded-md border border-gray-400 items-center">
        <BiLoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  if (noResults) {
    return (
      <div className="flex flex-col gap-y-2 p-4 rounded-md border border-gray-200 items-center">
        <LuSearch className="size-12 text-gray-500 bg-gray-100 rounded-full p-1" />
        <span className="text-lg font-bold text-gray-800">
          No results found
        </span>
        <span className="text-sm font-normal text-gray-500">
          Try searching for a different user
        </span>
        {/* <li className="flex flex-row gap-x-2 self-center items-center rounded-md">
          <Button variant="secondary" size="lg" icon={<LuPlus className="size-6" />} ariaLabel="Add a new user">
            Add a new user
          </Button>
        </li> */}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-y-2 p-2 rounded-md border border-gray-200">
      {users.map((user) => (
        <UserListItem
          key={user.id}
          user={user}
          selected={user.id === selectedUserId}
          onSelect={onUserSelect}
        />
      ))}
    </ul>
  );
};

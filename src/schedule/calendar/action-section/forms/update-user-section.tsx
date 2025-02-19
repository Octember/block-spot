import { useFormContext } from "react-hook-form";
import { TextInput } from "../../../../client/components/form/text-input";
import { CreateReservationFormInputs } from "../modals/types";
import { LuSearch } from "react-icons/lu";
import { UserList } from "./user/user-list";
import { User } from "./user/types";
import { useQuery, searchUsers } from "wasp/client/operations";
import { useState, useCallback, FC } from "react";
import { useDebounce } from "../../../../client/hooks/use-debounce";

export const UpdateReservationUserSection = () => {
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");

  // Debounce the search query to prevent too many API calls
  const debouncedSearchQuery = useDebounce(searchInput, 300);

  const { data, isLoading } = useQuery(searchUsers, {
    query: debouncedSearchQuery,
    sortBy,
  });

  const { setValue, watch } = useFormContext<CreateReservationFormInputs>();
  const selectedUser = watch("user");

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);
      // Clear the selected user when searching
      setValue("user", undefined);
    },
    [setValue],
  );

  const handleUserSelect = useCallback(
    (user: User | undefined) => {
      // If the user is already selected, deselect them
      if (!user || selectedUser?.id === user.id) {
        setValue("user", undefined);
        return;
      }

      // Otherwise, find and select the full user entity
      const fullUser = data?.users.find((u) => u.id === user.id);
      if (fullUser) {
        setValue("user", fullUser);
      }
    },
    [data?.users, setValue, selectedUser?.id],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-x-2 items-center">
          <h2 className="text-xl font-semibold">User</h2>
          <span className="text-sm font-normal text-gray-500">optional</span>
        </div>
      </div>

      <TextInput
        placeholder="Search for a user..."
        value={searchInput}
        onChange={handleSearch}
        // @ts-expect-error do not know why this is not working
        size="lg"
        icon={<LuSearch className="size-6" />}
      />
      {/* <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical')}
      className="rounded-md border border-gray-300 bg-white py-1.5 pl-3 pr-8 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
    >
      <option value="recent">Most Recent</option>
      <option value="alphabetical">Alphabetical</option>
    </select> */}

      <UserList
        users={
          data?.users.map((u) => ({
            id: u.id,
            name: u.name || "",
            email: u.email || "",
          })) || []
        }
        noResults={!isLoading && (!data?.users || data.users.length === 0)}
        isLoading={isLoading}
        selectedUserId={selectedUser?.id}
        onUserSelect={handleUserSelect}
      />

      <NoUserButton
        value={selectedUser === undefined}
        onClick={() => {
          if (selectedUser !== undefined) {
            setValue("user", undefined);
          }
        }}
      />
    </div>
  );
};

const NoUserButton: FC<{ value: boolean; onClick: () => void }> = ({
  value,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={`p-2 border ${value ? "border-sky-600" : "border-gray-200"} rounded-md flex flex-row gap-2 items-center`}
      onClick={onClick}
    >
      <input type="checkbox" checked={value} onChange={onClick} />

      <span>No specific user (walk in)</span>
    </button>
  );
};

import { useFormContext } from 'react-hook-form';
import { TextInput } from '../../../../client/components/form/text-input';
import { CreateReservationFormInputs } from '../modals/types';
import { LuCheck, LuPlus, LuSearch } from 'react-icons/lu';
import { UserAvatar } from '../../../../client/components/user-avatar';
import { User } from 'wasp/entities';
import { Button } from '../../../../client/components/button';

export const UpdateReservationUserSection = () => {
  const users = [{
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
  }, {
    id: "2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
  }]

  // const users: User[] = []
  const noResults = true;

  const { register } = useFormContext<CreateReservationFormInputs>();

  return <div className="flex flex-col gap-4">
    <div className="flex flex-row gap-x-2 items-center">
      <h2 className="text-xl font-semibold">User</h2>
      <span className="text-sm font-normal text-gray-500">optional</span>
    </div>

    <TextInput
      placeholder="Search for a user..."
      {...register("user")}
      // @ts-expect-error No idea why this is not working
      size="lg"
      icon={<LuSearch className="size-6" />}
    />

    {noResults && (
      <div className="flex flex-col gap-y-2 p-4 rounded-md border border-gray-400 items-center">
        <LuSearch className="size-12 text-gray-500 bg-gray-100 rounded-full p-1" />
        <span className="text-lg font-bold text-gray-800">No results found</span>
        <span className="text-sm font-normal text-gray-500">Try searching for a different user</span>
        <li className="flex flex-row gap-x-2 self-center items-center rounded-md">
          <Button variant="secondary" size="lg" icon={<LuPlus className="size-6" />} ariaLabel="Add a new user">
            Add a new user
          </Button>
        </li>
      </div>
    )}

    {!noResults && (
      <ul className="flex flex-col gap-y-2 p-2 rounded-md border border-gray-400">
        {users.map((user, i) => (
          <UserListItem key={user.id} user={user} selected={i % 2 === 0} />
        ))}
      </ul>
    )}
  </div>
}

const UserListItem = ({ user, selected }: { user: { id: string, name: string, email: string }, selected: boolean }) => {
  return <li className={`flex rounded-md hover:bg-gray-100 ${selected ? " border border-gray-400 bg-sky-600/10" : ""} `}>
    <button type="button" className="flex flex-row gap-x-4 items-center p-2 rounded-md hover:bg-gray-100 w-full">
      <UserAvatar user={user} size="sm" />

      <div className="flex flex-grow flex-col items-start">
        <span className="text-sm font-semibold">{user.name}</span>
        <span className="text-sm font-normal text-gray-500">{user.email}</span>
      </div>

      {selected && <LuCheck className="size-6 text-sky-600" />}
    </button>
  </li>
}


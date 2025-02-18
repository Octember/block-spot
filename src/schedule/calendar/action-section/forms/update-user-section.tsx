import { useFormContext } from 'react-hook-form';
import { TextInput } from '../../../../client/components/form/text-input';
import { CreateReservationFormInputs } from '../modals/types';
import { LuSearch } from 'react-icons/lu';
import { UserList } from './user/user-list';
import { User } from './user/types';

export const UpdateReservationUserSection = () => {
  const users: User[] = [{
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

    <UserList users={users} noResults={noResults} />
  </div>
}


import { FC } from 'react';
import { ReservationFormBase } from './reservation-basics-form';
import { UpdateReservationUserSection } from './update-user-section';
import { useAuthUser } from '../../../../auth/providers/AuthUserProvider';
import { Reservation } from 'wasp/entities';
import { useFormContext } from 'react-hook-form';
import { CreateReservationFormInputs } from '../modals/types';

export const ReservationForm: FC<{
  reservation: Reservation;
  onSubmit: (data: CreateReservationFormInputs) => void;
}> = ({ reservation, onSubmit }) => {
  const { isAdmin } = useAuthUser();

  const enableUserSection = isAdmin;
  const { handleSubmit } = useFormContext<CreateReservationFormInputs>();


  return <form
    onSubmit={handleSubmit(onSubmit)}
    className={`grid ${enableUserSection ? "sm:grid-cols-2" : ""} grid-cols-1 gap-12`}
  >
    <ReservationFormBase reservation={reservation} />

    {enableUserSection && (
      <UpdateReservationUserSection />
    )}
  </form>
};

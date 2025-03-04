import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { Reservation } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { CreateReservationFormInputs } from "../modals/types";
import { ReservationFormBase } from "./reservation-basics-form";
import { UpdateReservationUserSection } from "./update-user-section";

export const ReservationForm: FC<{
  reservation: Reservation;
  onSubmit: (data: CreateReservationFormInputs) => void;
}> = ({ reservation, onSubmit }) => {
  const { isOwner, isAdmin } = useAuthUser();

  const enableUserSection = isOwner && isAdmin;
  const { handleSubmit } = useFormContext<CreateReservationFormInputs>();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`grid ${enableUserSection ? "sm:grid-cols-2" : ""} grid-cols-1 gap-12`}
    >
      <ReservationFormBase reservation={reservation} />

      {enableUserSection && <UpdateReservationUserSection />}
    </form>
  );
};

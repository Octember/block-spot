import { FC } from "react";
import { ReservationFormBase } from "./reservation-basics-form";
import { UpdateReservationUserSection } from "./update-user-section";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { Reservation } from "wasp/entities";
import { useFormContext } from "react-hook-form";
import { CreateReservationFormInputs } from "../modals/types";
import { PriceBreakdownDisplay } from "./payments-form";
import { useParams } from "react-router-dom";

export const ReservationForm: FC<{
  reservation: Reservation;
  onSubmit: (data: CreateReservationFormInputs) => void;
}> = ({ reservation, onSubmit }) => {
  const { isOwner, isAdmin } = useAuthUser();
  const { venueId } = useParams();

  const enableUserSection = isOwner && isAdmin;
  const { handleSubmit } = useFormContext<CreateReservationFormInputs>();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`grid ${enableUserSection ? "sm:grid-cols-2" : ""} grid-cols-1 gap-12`}
    >
      <ReservationFormBase reservation={reservation} />

      <PriceBreakdownDisplay
        spaceId={reservation.spaceId}
        venueId={venueId || ""}
        startTime={reservation.startTime}
        endTime={reservation.endTime}
      />
      {/* {enableUserSection && <UpdateReservationUserSection />} */}
    </form>
  );
};

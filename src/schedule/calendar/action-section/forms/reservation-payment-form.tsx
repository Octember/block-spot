import { FC } from "react";
import { useFormContext } from "react-hook-form";
import { TextInput } from "../../../../client/components/form/text-input";
import { CreateReservationFormInputs } from "../modals/types";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { Reservation } from "wasp/entities";

export const ReservationPaymentForm: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { isAdmin } = useAuthUser();
  const { register, formState: { errors } } = useFormContext<CreateReservationFormInputs>();

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Details</h3>

      <div className="grid grid-cols-1 gap-4">

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Stripe Checkout ID</label>
          <TextInput
            {...register("stripeCheckoutId")}
          />
          {errors.stripeCheckoutId?.message && (
            <p className="text-sm text-red-600">{errors.stripeCheckoutId.message}</p>
          )}
        </div>

      </div>
    </div>
  );
};

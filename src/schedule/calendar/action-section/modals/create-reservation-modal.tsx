import { EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { FC, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createReservation } from "wasp/client/operations";
import { Reservation, User } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { Wizard } from "../../../../client/components/wizard";
import { useToast } from "../../../../client/toast";
import { getConnectedStripePromise } from "../../../../payment/stripe/stripe-react";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { StripeCheckoutForm, useClientSecret } from "../forms/payments-form";
import { ReservationForm } from "../forms/reservation-form";
import { CreateReservationFormInputs } from "./types";

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const CreateReservationWizard: FC<{
  reservation: Reservation & { user?: User };
}> = ({ reservation }) => {
  const { cancelChange } = usePendingChanges();
  const { refresh } = useScheduleContext();
  const toast = useToast();
  const { isAdmin } = useAuthUser();
  const { organization } = useAuthUser();

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
      user: reservation.user,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting, submitCount },
  } = form;

  async function onSubmit(data: CreateReservationFormInputs) {
    await createReservation({
      startTime: minutesToTime(data.date, data.startTimeMinutes),
      endTime: minutesToTime(data.date, data.endTimeMinutes),
      description: data.title,
      spaceId: data.spaceId,
    });

    refresh();
    toast({
      title: "Reservation created",
      description: "The reservation has been created",
    });

    setTimeout(() => {
      cancelChange();
    }, 300);
  }

  const { clientSecret } = useClientSecret();

  // console.log("organization.stripeAccountId", organization?.stripeAccountId);
  // console.log("clientSecret", clientSecret);

  const stripePromise2 = useMemo(() => {
    if (!organization?.stripeAccountId) {
      return undefined;
    }
    return getConnectedStripePromise(organization.stripeAccountId);
  }, [organization?.stripeAccountId]);

  if (!stripePromise2 || !clientSecret) {
    return <div>No stripe account id</div>;
  }

  const steps = [
    {
      title: "Create Reservation",
      description: "Create a new reservation",
      content: (
        <ReservationForm reservation={reservation} onSubmit={() => { }} />
      ),
    },
    ...(isAdmin
      ? [
        {
          title: "Payment",
          description: "Pay for the reservation",
          content: <StripeCheckoutForm />,
        },
      ]
      : []),
  ];

  return (
    <FormProvider {...form}>
      <EmbeddedCheckoutProvider
        stripe={stripePromise2}
        options={{ clientSecret }}
      >
        <Wizard
          steps={steps}
          size="2xl"
          open={true}
          isSubmitting={isSubmitting || submitCount > 0}
          onClose={cancelChange}
          onSubmit={handleSubmit(onSubmit)}
        />
      </EmbeddedCheckoutProvider>
    </FormProvider>
  );
};

import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { createReservation, runPaymentRules, useQuery } from "wasp/client/operations";
import { Reservation, User } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { Wizard } from "../../../../client/components/wizard";
import { useToast } from "../../../../client/toast";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { StripeCheckoutForm, StripeWrapper } from "../forms/payments-form";
import { ReservationForm } from "../forms/reservation-form";
import { CreateReservationFormInputs } from "./types";
import { useParams } from "react-router-dom";

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
  const { venueId } = useParams<{ venueId: string }>();
  const { refresh } = useScheduleContext();
  const toast = useToast();
  const { isAdmin } = useAuthUser();
  const { organization } = useAuthUser();

  const { data: paymentInfo } = useQuery(runPaymentRules, {
    spaceId: reservation.spaceId,
    venueId: venueId ?? "",
    startTime: reservation.startTime,
    endTime: reservation.endTime
  });

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
    try {
      const reservation = await createReservation({
        startTime: minutesToTime(data.date, data.startTimeMinutes),
        endTime: minutesToTime(data.date, data.endTimeMinutes),
        description: data.title,
        spaceId: data.spaceId,
        userId: data.user?.id,
      });

      refresh();
      toast({
        title: "Reservation created",
        description: "The reservation has been created",
      });

      setTimeout(() => {
        cancelChange();
      }, 300);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error creating reservation",
        type: "error",
        description: `${error}`,
      });
    }
  }

  const enablePayments = isAdmin && organization?.stripeAccountId && paymentInfo?.requiresPayment;

  const steps = [
    {
      title: "Create Reservation",
      description: "Create a new reservation",
      content: (
        <ReservationForm reservation={reservation} onSubmit={() => { }} />
      ),
    },
    ...(enablePayments
      ? [
        {
          title: "Payment",
          description: "Pay for the reservation",
          content: (
            <StripeWrapper organization={organization} spaceId={reservation.spaceId}>
              <StripeCheckoutForm />
            </StripeWrapper>
          ),
        },
      ]
      : []),
  ];

  return (
    <FormProvider {...form}>
      <Wizard
        steps={steps}
        size="2xl"
        open={true}
        isSubmitting={isSubmitting || submitCount > 0}
        onClose={cancelChange}
        onSubmit={handleSubmit(onSubmit)}
      />
    </FormProvider>
  );
};

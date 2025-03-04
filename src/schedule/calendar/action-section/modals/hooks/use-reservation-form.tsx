import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { createReservation, runPaymentRules, useQuery } from "wasp/client/operations";
import { Reservation, User } from "wasp/entities";
import { useToast } from "../../../../../client/toast";
import { usePendingChanges } from "../../../providers/pending-changes-provider";
import { useScheduleContext } from "../../../providers/schedule-context-provider";
import { useAuthUser } from "../../../../../auth/providers/AuthUserProvider";
import { CreateReservationFormInputs } from "../types";
import { timeToMinutes, minutesToTime } from "../../timing";

interface UseReservationFormProps {
  reservation: Reservation & { user?: User };
}

export function useReservationForm({ reservation }: UseReservationFormProps) {
  const { cancelChange } = usePendingChanges();
  const { venueId } = useParams<{ venueId: string }>();
  const { refresh } = useScheduleContext();
  const toast = useToast();
  const { isAdmin, organization } = useAuthUser();

  const { data: paymentInfo } = useQuery(runPaymentRules, {
    spaceId: reservation.spaceId,
    venueId: venueId ?? "",
    startTime: reservation.startTime,
    endTime: reservation.endTime,
  });

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
      user: reservation.user,

      context: {
        step: "select_details",
      },
    },
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting, submitCount },
    watch,
  } = form;

  const currentStep = watch("context.step");

  async function onSubmit(data: CreateReservationFormInputs) {
    try {
      const createdReservation = await createReservation({
        startTime: minutesToTime(data.date, data.startTimeMinutes),
        endTime: minutesToTime(data.date, data.endTimeMinutes),
        description: data.title,
        spaceId: data.spaceId,
        userId: data.user?.id,
      });

      setValue("context.createdReservation", createdReservation);
      setValue("context.step", "success");

      refresh();
      toast({
        title: "Reservation created",
        description: "The reservation has been created",
      });
    } catch (error) {
      setValue("context.step", "error");
      console.error(error);
      toast({
        title: "Error creating reservation",
        type: "error",
        description: `${error}`,
      });
    }
  }

  const enablePayments =
    isAdmin && organization?.stripeAccountId && paymentInfo?.requiresPayment;

  return {
    form,
    handleSubmit,
    setValue,
    isSubmitting,
    submitCount,
    currentStep,
    onSubmit,
    enablePayments,
    venueId,
    cancelChange,
    organization,
  };
} 
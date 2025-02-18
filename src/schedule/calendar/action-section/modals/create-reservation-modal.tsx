import { FormProvider, useForm } from "react-hook-form";
import { Modal } from "../../../../client/components/modal";
import { usePendingChanges } from "../../providers/pending-changes-provider";

import { FC } from "react";
import { createReservation } from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { useToast } from "../../../../client/toast";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { UpdateReservationActionButtons } from "../components/action-buttons";
import { ReservationFormBase } from '../forms/reservation-basics-form';
import { UpdateReservationUserSection } from '../forms/update-user-section';
import { CreateReservationFormInputs } from "./types";
import { ReservationForm } from '../forms/reservation-form';

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const CreateReservationModal: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { cancelChange } = usePendingChanges();
  const { refresh } = useScheduleContext();
  const toast = useToast();
  const { isAdmin } = useAuthUser();

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: reservation.startTime,
      startTimeMinutes: timeToMinutes(reservation.startTime),
      endTimeMinutes: timeToMinutes(reservation.endTime),
      title: reservation.description ?? "",
      spaceId: reservation.spaceId,
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

  return (
    <Modal
      className="flex"
      open={true}
      size="2xl"
      onClose={() => cancelChange()}
      heading={{ title: "New Reservation" }}
      footer={
        <UpdateReservationActionButtons
          onCancel={cancelChange}
          onSubmit={handleSubmit(onSubmit)}
          isLoading={isSubmitting || submitCount > 0}
        />
      }
    >
      <FormProvider {...form}>
        <ReservationForm
          onSubmit={onSubmit}
          reservation={reservation}
        />
      </FormProvider>
    </Modal >
  );
};


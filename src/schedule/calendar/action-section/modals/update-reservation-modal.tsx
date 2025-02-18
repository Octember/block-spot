import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { FC } from "react";
import { FormProvider, useForm } from 'react-hook-form';
import { updateReservation } from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { Button } from "../../../../client/components/button";
import { Modal } from "../../../../client/components/modal";
import { useToast } from "../../../../client/toast";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import { ReservationForm } from "../forms/reservation-form";
import { CreateReservationFormInputs } from './types';

type UpdateReservationFormInputs = {
  date: Date;
  startTimeMinutes: number;
  endTimeMinutes: number;
  spaceId: string;
  title: string;
};

function timeToMinutes(time: Date) {
  return time.getHours() * 60 + time.getMinutes();
}

function minutesToTime(date: Date, minutes: number) {
  const newDate = new Date(date);
  newDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return newDate;
}

export const UpdateReservationModal: FC<{
  reservation: Reservation;
}> = ({ reservation }) => {
  const { cancelChange } = usePendingChanges();
  const { refresh } = useScheduleContext();
  const toast = useToast();

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


  async function onSubmit(data: UpdateReservationFormInputs) {
    await updateReservation({
      id: reservation.id,
      startTime: minutesToTime(data.date, data.startTimeMinutes),
      endTime: minutesToTime(data.date, data.endTimeMinutes),
      description: data.title,
      spaceId: data.spaceId,
    });

    refresh();
    toast({
      title: "Reservation updated",
      description: "The reservation has been updated successfully",
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
      onClose={cancelChange}
      heading={{ title: "Update Reservation" }}
      footer={
        <div className="flex items-center justify-end space-x-3 m-2">
          <Button
            onClick={cancelChange}
            ariaLabel="Cancel"
            variant="secondary"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || submitCount > 0}
            icon={<ArrowRightCircleIcon className="w-6 h-6" />}
            isLoading={isSubmitting || submitCount > 0}
            ariaLabel="Confirm"
            variant="primary"
            size="lg"
          >
            Update Booking
          </Button>
        </div>
      }
    >
      <FormProvider {...form}>
        <ReservationForm
          reservation={reservation}
          onSubmit={onSubmit}
        />
      </FormProvider>
    </Modal>
  );
};

import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import {
  createReservation,
  runPaymentRules,
  useQuery,
} from "wasp/client/operations";
import { Reservation, User } from "wasp/entities";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";
import { Button } from "../../../../client/components/button";
import { Modal } from "../../../../client/components/modal";
import { useToast } from "../../../../client/toast";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { useScheduleContext } from "../../providers/schedule-context-provider";
import {
  StripeCheckoutForm,
  StripeWrapper,
} from "../forms/payments-form";
import { ReservationForm } from "../forms/reservation-form";
import { CreateReservationFormInputs } from "./types";
import { timeToMinutes, minutesToTime } from "../timing";
import { ErrorScreen } from "./screens/error-screen";
import { SuccessScreen } from "./screens/success-screen";
import { PricingScreen } from "./screens/pricing-screen";

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
    endTime: reservation.endTime,
  });

  const form = useForm<CreateReservationFormInputs>({
    defaultValues: {
      step: "select_details",
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
    setValue,
    formState: { isSubmitting, submitCount },
  } = form;

  const currentStep = form.watch("step");

  async function onSubmit(data: CreateReservationFormInputs) {
    try {
      const reservation = await createReservation({
        startTime: minutesToTime(data.date, data.startTimeMinutes),
        endTime: minutesToTime(data.date, data.endTimeMinutes),
        description: data.title,
        spaceId: data.spaceId,
        userId: data.user?.id,
      });
      setValue("createdReservation", reservation);
      setValue("step", "success");

      refresh();
      toast({
        title: "Reservation created",
        description: "The reservation has been created",
      });
    } catch (error) {
      setValue("step", "error");
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

  return (
    <FormProvider {...form}>
      <Modal
        open={true}
        onClose={cancelChange}
        size="2xl"
        heading={{
          title: "Create Reservation",
        }}
        footer={
          <div className="flex items-center justify-end space-x-3 m-2">
            {currentStep === "select_details" && (
              <>
                <Button
                  ariaLabel="Cancel"
                  variant="secondary"
                  size="lg"
                  onClick={cancelChange}
                >
                  Cancel
                </Button>

                {enablePayments ? (
                  <Button
                    ariaLabel="Next"
                    variant="primary"
                    size="lg"
                    onClick={() => setValue("step", "pricing")}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    ariaLabel="Next"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting || submitCount > 0}
                    onClick={handleSubmit(onSubmit)}
                  >
                    Submit
                  </Button>
                )}
              </>
            )}

            {currentStep === "pricing" && (
              <>
                <Button
                  ariaLabel="Back"
                  variant="secondary"
                  size="lg"
                  onClick={() => setValue("step", "select_details")}
                >
                  Back
                </Button>
                <Button
                  ariaLabel="Proceed to Payment"
                  variant="primary"
                  size="lg"
                  onClick={() => setValue("step", "payment")}
                >
                  Proceed to Payment
                </Button>
              </>
            )}

            {currentStep === "success" && (
              <Button
                ariaLabel="Close"
                variant="primary"
                size="lg"
                onClick={cancelChange}
              >Done</Button>
            )}
          </div>
        }
      >
        {currentStep === "select_details" && (
          <ReservationForm reservation={reservation} onSubmit={() => { }} />
        )}
        {currentStep === "pricing" && venueId && (
          <PricingScreen reservation={reservation} venueId={venueId} />
        )}
        {currentStep === "payment" && (
          <StripeWrapper
            organization={organization}
            spaceId={reservation.spaceId}
          >
            <StripeCheckoutForm />
          </StripeWrapper>
        )}
        {currentStep === "error" && <ErrorScreen />}
        {currentStep === "success" && <SuccessScreen />}
      </Modal>
    </FormProvider>
  );
}; 
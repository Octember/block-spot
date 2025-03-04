// import { DevTool } from "@hookform/devtools";
import { FC } from "react";
import { FormProvider } from "react-hook-form";
import { Reservation, User } from "wasp/entities";
import { Button } from "../../../../client/components/button";
import { Modal } from "../../../../client/components/modal";
import {
  StripeCheckoutForm,
  StripeWrapper,
} from "../forms/payments-form";
import { ReservationForm } from "../forms/reservation-form";
import { useReservationForm } from './hooks/use-reservation-form';
import { ErrorScreen } from "./screens/error-screen";
import { PricingScreen } from "./screens/pricing-screen";
import { SuccessScreen } from "./screens/success-screen";

export const CreateReservationWizard: FC<{
  reservation: Reservation & { user?: User };
}> = ({ reservation }) => {

  const {
    form,
    onSubmit,
    currentStep,
    enablePayments,
    cancelChange,
    setValue,
    handleSubmit,
    isSubmitting,
    submitCount,
    venueId,
    organization,
  } = useReservationForm({ reservation })


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
                    onClick={() => setValue("context.step", "pricing")}
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
                  onClick={() => setValue("context.step", "select_details")}
                >
                  Back
                </Button>
                <Button
                  ariaLabel="Proceed to Payment"
                  variant="primary"
                  size="lg"
                  onClick={() => setValue("context.step", "payment")}
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
        {/* <DevTool control={form.control} /> */}

      </Modal>
    </FormProvider>
  );
}; 
import { useForm } from 'react-hook-form';
import { Button } from "../../../client/components/button";
import { FormField } from '../../../client/components/form/form-field';
import { Modal } from "../../../client/components/modal";
import {
  usePendingChanges
} from "../providers/pending-changes-provider";


type CreateReservationFormInputs = {
  date: string;
  time: string;
  duration: string;
  location: string;
  title: string;
}

export const CreateReservationModal = () => {
  const { pendingChange, cancelChange, applyChange } = usePendingChanges();

  if (!pendingChange) return null;

  const {
    register,
    handleSubmit,
    reset,

    formState: { isSubmitting },
  } = useForm<CreateReservationFormInputs>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      time: "",
      duration: "",
      location: "",
      title: "",
    },
  });

  function onSubmit(data: CreateReservationFormInputs) {
    console.log("submitted", data);
  }

  return (
    <>
      <Modal
        className="flex"
        open={true}
        size="lg"
        onClose={() => { }}
        heading={{ title: "New Reservation" }}
        footer={
          <div className="flex items-center justify-end space-x-3 m-2">
            <Button
              onClick={cancelChange}
              ariaLabel="Cancel"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={applyChange} ariaLabel="Confirm" variant="primary">
              Confirm
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Date" required>
            <input type="date" {...register("date")} />
          </FormField>


          {/* <TimeSelect
            // time={reservation.startTime}
            onChange={(hour, minute) => {
              if (!pendingChange) return;

            }}
          />
          -
          <TimeSelect
            time={reservation.endTime}
            onChange={(hour, minute) => {
              if (!pendingChange) return;
              if (hour < reservation.startTime.getHours()) return;

              setPendingChange({
                ...pendingChange,
                newState: {
                  ...pendingChange.newState,
                  endTime: new Date(
                    reservation.endTime.setHours(hour, minute),
                  ),
                },
              });
            }} */}
          {/* /> */}
        </form>
      </Modal>

    </>
  );
};

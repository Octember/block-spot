import { useForm, SubmitHandler } from "react-hook-form";
import { Modal } from "../../../client/components/modal";
import { Button } from "../../../client/components/button";
import { TextInput } from "../../../client/components/form/text-input";
import { FormField } from "../../../client/components/form/form-field";
import { createSpace } from "wasp/client/operations";

type AddSpaceFormInputs = {
  name: string;
  capacity: number;
};

export const AddSpaceModal = ({
  open,
  onClose,
  venueId,
}: {
  open: boolean;
  onClose: () => void;
  venueId: string;
}) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<AddSpaceFormInputs>({
    defaultValues: {
      name: "",
      capacity: 1,
    },
  });

  const onSubmit: SubmitHandler<AddSpaceFormInputs> = async (data) => {
    try {
      await createSpace({
        venueId,
        name: data.name,
        capacity: data.capacity,
      });
      reset();
      onClose();
    } catch (err: any) {
      console.error("Failed to create space:", err);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      heading={{
        title: "Add Space",
        description: "Add a new space to your venue",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Space Name">
          <TextInput
            type="text"
            placeholder="e.g., Pottery Wheel 1"
            {...register("name", { required: true })}
          />
        </FormField>

        <FormField label="Capacity">
          <TextInput
            type="number"
            min="1"
            {...register("capacity", {
              required: true,
              valueAsNumber: true,
              min: 1
            })}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            type="button"
            ariaLabel="Cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            ariaLabel="Add Space"
          >
            Add Space
          </Button>
        </div>
      </form>
    </Modal>
  );
};

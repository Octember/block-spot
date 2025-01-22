import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { deleteSpace } from "wasp/client/operations";
import { Modal } from "../../../client/components/modal";
import { useToast } from "../../../client/toast";
import { Button } from "../../../client/components/button";

export const DeleteSpaceButton = ({ spaceId }: { spaceId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const handleDelete = async () => {
    try {
      await deleteSpace({ spaceId });
      setIsOpen(false);
      toast({
        type: "success",
        title: "Space deleted",
      });
    } catch (error) {
      console.error("Failed to delete space:", error);
      toast({
        type: "error",
        title: "Failed to delete space",
        description: "Please try again later",
      });
    }
  };

  return (
    <>
      <Button
        ariaLabel="Delete space"
        variant="tertiary"
        className="group"
        icon={
          <TrashIcon className="size-4 stroke-gray-500 group-hover:stroke-red-700" />
        }
        onClick={() => setIsOpen(true)}
      />

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        size="sm"
        heading={{
          title: "Delete Space",
          description:
            "Are you sure you want to delete this space? This action cannot be undone.",
        }}
        footer={
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <Button
              ariaLabel="Confirm delete space"
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
            <div className="sm:ml-3" />
            <Button
              ariaLabel="Cancel delete space"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-500">
          All reservations associated with this space will also be deleted.
        </p>
      </Modal>
    </>
  );
};

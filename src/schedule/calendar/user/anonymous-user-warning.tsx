import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button } from "../../../client/components/button";
import { Modal } from "../../../client/components/modal";
import { useScheduleContext } from "../providers/schedule-query-provider";

export const AnonymousUserWarning = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { venue } = useScheduleContext();

  return (
    <Modal
      open={isOpen}
      onClose={() => setIsOpen(false)}
      size="sm"
      heading={{
        title: "Access Required",
        description: "You need an invitation to make reservations",
      }}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <EnvelopeIcon className="size-12 text-yellow-500" />
        <div className="text-center">
          <p className="text-gray-600">
            To make reservations at <span className="font-semibold">{venue.name}</span>,
            please contact the venue owner to receive an invitation.
          </p>
        </div>
        <Button
          onClick={() => setIsOpen(false)}
          variant="primary"
          ariaLabel="Close"
        >
          Got it
        </Button>
      </div>
    </Modal>
  );
};

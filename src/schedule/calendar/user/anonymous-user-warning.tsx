import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "../../../client/components/button";
import { Modal } from "../../../client/components/modal";
import { useVenueContext } from '../providers/venue-provider';

export const AnonymousUserWarning = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { venue } = useVenueContext();

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="sm"
      heading={{
        title: "Access Required",
        description: "You need an invitation to make reservations",
      }}
      footer={
        <div className="flex items-center justify-center space-x-3 m-2">
          <Button onClick={onClose} variant="primary" ariaLabel="Close">
            Got it
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-gray-600">
            To make reservations at{" "}
            <span className="font-semibold">{venue.name}</span>, please contact
            the venue owner to receive an invitation.
          </p>
          <p className="text-gray-600 flex items-center gap-2">
            <EnvelopeIcon className="size-8 text-yellow-500" />
            Email:
            <a
              href={`mailto:${venue.contactEmail}?subject=Invitation to ${venue.name} on BlockSpot`}
              target="_top"
              className="text-blue-500"
            >
              {venue.contactEmail}
            </a>
          </p>
          <p className="text-gray-600">
            If you have an invitation, please sign in to your account.
          </p>
        </div>
      </div>
    </Modal>
  );
};

import { FC } from "react";
import { usePendingChanges } from "../providers/pending-changes-provider";
import { CreateReservationModal } from "./modals/create-reservation-modal";
import { DeleteReservationModal } from "./modals/delete-reservation-modal";
import { UpdateReservationModal } from "./modals/update-reservation-modal";

export const PendingChangesSection: FC = () => {
  const { pendingChange } = usePendingChanges();

  if (!pendingChange) {
    return null;
  }

  if (pendingChange.type === "CREATE") {
    return <CreateReservationModal reservation={pendingChange.newState} />;
  } else if (pendingChange.type === "UPDATE") {
    return <UpdateReservationModal reservation={pendingChange.newState} />;
  } else if (pendingChange.type === "DELETE") {
    return <DeleteReservationModal reservation={pendingChange.newState} />;
  }
};

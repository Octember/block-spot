import {
  createContext,
  SetStateAction,
  Dispatch,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from "wasp/client/operations";
import { Reservation } from "wasp/entities";
import { useToast } from "../../../client/toast";
import { useScheduleContext } from "./schedule-context-provider";
import { useVenueContext } from "./venue-provider";

export interface PendingChange {
  type: "CREATE" | "UPDATE" | "DELETE";
  oldState?: Reservation;
  newState: Reservation;
}

interface PendingChangesContextType {
  pendingChange: PendingChange | null;
  hasPendingChange: boolean;
  setPendingChange: Dispatch<SetStateAction<PendingChange | null>>;
  cancelChange: () => void;
  applyChange: () => Promise<void>;
}

const PendingChangesContext = createContext<
  PendingChangesContextType | undefined
>(undefined);

interface PendingChangesProviderProps {
  children: React.ReactNode;
}

export const PendingChangesProvider: React.FC<PendingChangesProviderProps> = ({
  children,
}) => {
  const setToast = useToast();
  const { selectedDate } = useVenueContext();
  const { refresh } = useScheduleContext();
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(
    null,
  );
  useEffect(() => {
    setPendingChange(null);
  }, [selectedDate]);

  const hasPendingChange = useMemo(
    () => pendingChange !== null,
    [pendingChange],
  );

  const cancelChange = () => {
    setPendingChange(null);
    refresh();
  };

  const applyChange = async () => {
    if (!pendingChange) return;

    try {
      switch (pendingChange.type) {
        case "DELETE":
          if (pendingChange.oldState) {
            await deleteReservation({ id: pendingChange.oldState.id });
          }
          break;
        case "UPDATE":
          await updateReservation(pendingChange.newState);
          break;
        case "CREATE":
          // Note: This would need a createReservation operation
          await createReservation(pendingChange.newState);
          break;
      }

      setToast({ title: "Change applied successfully" });
      refresh();
      setPendingChange(null);
    } catch (error) {
      setToast({
        title: "Failed to apply change",
        type: "error",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <PendingChangesContext.Provider
      value={{
        pendingChange,
        hasPendingChange,
        setPendingChange: (change) => {
          setPendingChange(change);
        },
        cancelChange,
        applyChange,
      }}
    >
      {children}
    </PendingChangesContext.Provider>
  );
};

export const usePendingChanges = () => {
  const context = useContext(PendingChangesContext);
  if (!context) {
    throw new Error(
      "usePendingChanges must be used within a PendingChangesProvider",
    );
  }
  return context;
};

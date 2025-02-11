import { createContext, useContext, useEffect, useState } from "react";
import { Reservation } from "wasp/entities";
import { useScheduleContext } from "./schedule-context-provider";
import { useVenueContext } from "./venue-provider";

interface DraftReservationContextType {
  draftReservation: Reservation | null;
  setDraftReservation: (reservation: Reservation | null) => void;
}

const DraftReservationContext = createContext<
  DraftReservationContextType | undefined
>(undefined);

export const DraftReservationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [draftReservation, setDraftReservation] = useState<Reservation | null>(
    null,
  );
  const { selectedDate } = useVenueContext();

  useEffect(() => {
    setDraftReservation(null);
  }, [selectedDate]);

  return (
    <DraftReservationContext.Provider
      value={{ draftReservation, setDraftReservation }}
    >
      {children}
    </DraftReservationContext.Provider>
  );
};

export const useDraftReservation = () => {
  const context = useContext(DraftReservationContext);
  if (!context) {
    throw new Error(
      "useDraftReservation must be used within a DraftReservationProvider",
    );
  }
  return context;
};

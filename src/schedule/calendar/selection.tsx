import { createContext, useContext, useState } from "react";
import { useAuth } from "wasp/client/auth";
import { Venue } from "wasp/entities";
import { useTimeLabels } from "./constants";
import { usePendingChanges } from "./providers/pending-changes-provider";
import { useScheduleContext } from "./providers/schedule-context-provider";
import { getSharedGridStyle } from "./reservations/constants";
import { getTimeFromRowIndex } from "./reservations/utilities";
import { AnonymousUserWarning } from "./user/anonymous-user-warning";
import { useVenueContext } from "./providers/venue-provider";

interface Selection {
  start: { row: number; col: number } | null;
  current: { row: number; col: number } | null;
}

interface SelectionContextType {
  selection: Selection;
  isSelecting: boolean;
  handleMouseDown: (row: number, col: number) => void;
  handleMouseMove: (row: number, col: number) => void;
  handleMouseUp: () => void;
  getGridCell: (row: number, col: number) => string;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined,
);

function getStartEndRows(selection: {
  start: { row: number; col: number };
  current: { row: number; col: number };
}): { start: number; end: number } {
  if (selection.start.row > selection.current.row) {
    return { start: selection.current.row, end: selection.start.row + 1 };
  }

  return { start: selection.start.row, end: selection.current.row + 1 };
}

function getStartEndRowsValidated(selection: {
  start: { row: number; col: number };
  current: { row: number; col: number };
}): { start: number; end: number } {
  const { start, end } = getStartEndRows(selection);

  if (end - start <= 3) {
    // TODO: use venue default time minimum
    return { start, end: start + 3 };
  }

  return { start, end };
}

function getStartEndTime(
  venue: Venue,
  date: Date,
  selection: {
    start: { row: number; col: number };
    current: { row: number; col: number };
  },
): { start: Date; end: Date } {
  const { start, end } = getStartEndRowsValidated(selection);

  const startTime = calculateTimeFromRow(venue, date, start);
  const endTime = calculateTimeFromRow(venue, date, end);
  return { start: startTime, end: endTime };
}

const calculateTimeFromRow = (venue: Venue, date: Date, row: number): Date => {
  // Can cause bugs if date is mutated, need to clone it
  const result = new Date(date);
  const hoursMinutes = getTimeFromRowIndex(venue, row);

  result.setHours(hoursMinutes.getHours(), hoursMinutes.getMinutes(), 0, 0);
  return result;
};

interface SelectionProviderProps {
  children: React.ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
}) => {
  const { isTimeAvailable } = useScheduleContext();

  const [selection, setSelection] = useState<Selection>({
    start: null,
    current: null,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const { pendingChange } = usePendingChanges();

  const handleMouseDown = (row: number, col: number) => {
    if (!isTimeAvailable(row, col) || pendingChange) {
      return;
    }

    setIsSelecting(true);
    setSelection({ start: { row, col }, current: { row, col } });
  };

  const handleMouseMove = (row: number, col: number) => {
    if (!isTimeAvailable(row, col)) {
      handleMouseUp();
      return;
    }

    if (isSelecting) {
      setSelection((prev) => ({ ...prev, current: { row, col } }));
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelection({ start: null, current: null });
  };

  const getGridCell = (row: number, col: number) => {
    if (!selection.start || !selection.current || !isSelecting) return "";
    if (!isTimeAvailable(row, col)) return "";

    const minRow = Math.min(selection.start.row, selection.current.row);
    const maxRow = Math.max(selection.start.row, selection.current.row);
    const minCol = Math.min(selection.start.col, selection.current.col);
    const maxCol = Math.max(selection.start.col, selection.current.col);

    if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
      return "bg-cyan-600/20";
    }
    return "";
  };

  return (
    <SelectionContext.Provider
      value={{
        selection,
        isSelecting,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        getGridCell,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useReservationSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error(
      "useReservationSelection must be used within a SelectionProvider",
    );
  }
  return context;
};

export const GridSelection: React.FC = () => {
  const { setPendingChange } = usePendingChanges();
  const [anonUserWarningOpen, setAnonUserWarningOpen] = useState(false);
  const timeLabels = useTimeLabels();
  const { venue, selectedDate } = useVenueContext();
  const { isTimeAvailable } = useScheduleContext();

  const { data: user } = useAuth();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp: onMouseUp,
    selection,
    isSelecting,
    getGridCell,
  } = useReservationSelection();

  const handleMouseUp = () => {
    if (selection.start && selection.current && isSelecting) {
      // Validate entire selection range
      const minRow = Math.min(selection.start.row, selection.current.row);
      const maxRow = Math.max(selection.start.row, selection.current.row);

      // Check if any row in the selection is unavailable
      const isSelectionValid = Array.from(
        { length: maxRow - minRow + 1 },
        (_, i) => minRow + i,
      ).every((row) => isTimeAvailable(row, selection.start?.col || 0));

      if (isSelectionValid) {
        const { start, end } = getStartEndTime(venue, selectedDate, {
          start: selection.start,
          current: selection.current,
        });

        setPendingChange({
          type: "CREATE",
          newState: {
            id: "draft",
            spaceId: venue.spaces[selection.start.col].id,
            startTime: start,
            endTime: end,
            status: "PENDING",
            userId: "", // its set on backend
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
          },
        });
      }
    }
    onMouseUp();
  };

  return (
    <div
      {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {Array.from({ length: timeLabels.length * 12 }).map((_, row) =>
        Array.from({ length: venue.spaces.length }).map((_, col) => {
          if (row === 0) return <div key={`${row + 1}-${col}`} />;

          if (user) {
            return (
              // Add ones to account for 1-based grid indexing
              <div
                key={`${row + 1}-${col}`}
                className={`${getGridCell(row + 1, col)} inset-1 z-10 rounded ${isTimeAvailable(row + 1, col) ? "cursor-pointer" : ""}`}
                onMouseDown={() => handleMouseDown(row + 1, col)}
                onMouseMove={() => handleMouseMove(row + 1, col)}
              />
            );
          }

          return (
            <div
              key={`${row + 1}-${col}`}
              className="cursor-pointer"
              onClick={() => setAnonUserWarningOpen(true)}
            />
          );
        }),
      )}
      <AnonymousUserWarning
        isOpen={anonUserWarningOpen}
        onClose={() => setAnonUserWarningOpen(false)}
      />
    </div>
  );
};

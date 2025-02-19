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
import { useAuthUser } from "../../auth/providers/AuthUserProvider";

interface GridArea {
  rowStart: number;
  rowEnd: number;
  colStart: number;
  colEnd: number;
}

interface Selection {
  gridArea: GridArea | null;
  isSelecting: boolean;
}

interface SelectionContextType {
  selection: Selection;
  handleMouseDown: (row: number, col: number) => void;
  handleMouseMove: (row: number, col: number) => void;
  handleMouseUp: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

function calculateGridArea(
  start: { row: number; col: number },
  current: { row: number; col: number }
): GridArea {
  return {
    rowStart: Math.min(start.row, current.row) + 1,
    rowEnd: Math.max(start.row, current.row) + 2,
    colStart: Math.min(start.col, current.col) + 1,
    colEnd: Math.max(start.col, current.col) + 2,
  };
}

interface SelectionProviderProps {
  children: React.ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
}) => {
  const { isTimeAvailable } = useScheduleContext();
  const [selection, setSelection] = useState<Selection>({
    gridArea: null,
    isSelecting: false,
  });
  const [startPosition, setStartPosition] = useState<{ row: number; col: number } | null>(null);
  const { pendingChange } = usePendingChanges();

  const handleMouseDown = (row: number, col: number) => {
    if (!isTimeAvailable(row, col) || pendingChange) {
      return;
    }

    setStartPosition({ row, col });
    setSelection({
      gridArea: calculateGridArea({ row, col }, { row, col }),
      isSelecting: true,
    });
  };

  const handleMouseMove = (row: number, col: number) => {
    if (!selection.isSelecting || !startPosition) return;
    if (!isTimeAvailable(row, col)) {
      handleMouseUp();
      return;
    }

    setSelection({
      gridArea: calculateGridArea(startPosition, { row, col }),
      isSelecting: true,
    });
  };

  const handleMouseUp = () => {
    setSelection({ gridArea: null, isSelecting: false });
    setStartPosition(null);
  };

  return (
    <SelectionContext.Provider
      value={{
        selection,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
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
  const { user, isOwner } = useAuthUser();

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    selection,
  } = useReservationSelection();

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    // Get grid coordinates from mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate row and column from pixel position
    const col = Math.floor(x / (rect.width / venue.spaces.length));
    const row = Math.floor(y / 16) - 1; // Subtract 1 to account for header

    handleMouseMove(row, col);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / (rect.width / venue.spaces.length));
    const row = Math.floor(y / 16) - 1;

    if (row < 0) return; // Don't select header
    handleMouseDown(row, col);
  };

  const handleContainerMouseUp = () => {
    if (selection.gridArea && selection.isSelecting) {
      const { rowStart, rowEnd, colStart } = selection.gridArea;

      // Check if any row in the selection is unavailable
      const isSelectionValid = Array.from(
        { length: rowEnd - rowStart },
        (_, i) => rowStart + i,
      ).every((row) => isTimeAvailable(row, colStart - 1));

      if (isSelectionValid) {
        const start = getTimeFromRowIndex(venue, rowStart, selectedDate);
        const end = getTimeFromRowIndex(venue, rowEnd, selectedDate);

        setPendingChange({
          type: "CREATE",
          newState: {
            id: "draft",
            spaceId: venue.spaces[colStart - 1].id,
            startTime: start,
            endTime: end,
            status: "PENDING",
            userId: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
            createdById: user?.id || "",
            user,
          },
        });
      }
    }
    handleMouseUp();
  };

  if (!user) {
    return (
      <>
        <div
          {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}
          className="cursor-pointer"
          onClick={() => setAnonUserWarningOpen(true)}
        />
        <AnonymousUserWarning
          isOpen={anonUserWarningOpen}
          onClose={() => setAnonUserWarningOpen(false)}
        />
      </>
    );
  }

  const { style, className } = getSharedGridStyle(timeLabels.length, venue.spaces.length)

  return (
    <div
      style={style}
      className={`${className} relative cursor-pointer`}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      {selection.gridArea && (
        <div
          className="bg-cyan-600/20 mx-2 my-0.5 rounded"
          style={{
            gridRow: `${selection.gridArea.rowStart} / ${selection.gridArea.rowEnd}`,
            gridColumn: `${selection.gridArea.colStart} / ${selection.gridArea.colEnd}`,
          }}
        />
      )}
    </div>
  );
};

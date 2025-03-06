import { createContext, useContext, useState } from "react";
import { useAuthUser } from "../../auth/providers/AuthUserProvider";
import { useTimeLabels, useIsTimeZoneDifferent } from "./constants";
import { usePendingChanges } from "./providers/pending-changes-provider";
import { useScheduleContext } from "./providers/schedule-context-provider";
import { useVenueContext } from "./providers/venue-provider";
import { getSharedGridStyle } from "./reservations/constants";
import { getTimeFromRowIndex } from "./reservations/utilities";
import { AnonymousUserWarning } from "./user/anonymous-user-warning";

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

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined,
);

function calculateGridArea(
  start: { row: number; col: number },
  current: { row: number; col: number },
): GridArea {
  return {
    rowStart: Math.min(start.row, current.row),
    rowEnd: Math.max(start.row, current.row) + 1,
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
  const [startPosition, setStartPosition] = useState<{
    row: number;
    col: number;
  } | null>(null);
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

function getGridCoordinates(
  event: React.MouseEvent,
  containerRect: DOMRect,
  spacesLength: number,
  isTimeZoneDifferent: boolean = false,
): { row: number; col: number } {
  const x = event.clientX - containerRect.left;
  const y = event.clientY - containerRect.top;

  // TODO: This is a hack to account for the timezone label width
  // I think it's wrong
  const labelOffset = isTimeZoneDifferent ? 24 : 14;
  const col = Math.floor(
    (x + labelOffset) / (containerRect.width / spacesLength),
  );
  const row = Math.floor(y / 16);

  return { row, col };
}

export const GridSelection: React.FC = () => {
  const { setPendingChange } = usePendingChanges();
  const [anonUserWarningOpen, setAnonUserWarningOpen] = useState(false);
  const timeLabels = useTimeLabels();
  const { venue, selectedDate } = useVenueContext();
  const { isTimeAvailable } = useScheduleContext();
  const { user } = useAuthUser();
  const isTimeZoneDifferent = useIsTimeZoneDifferent();

  const { handleMouseDown, handleMouseMove, handleMouseUp, selection } =
    useReservationSelection();

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { row, col } = getGridCoordinates(e, rect, venue.spaces.length);
    handleMouseMove(row, col);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { row, col } = getGridCoordinates(
      e,
      rect,
      venue.spaces.length,
      isTimeZoneDifferent,
    );

    if (row < 0) return; // Don't select header
    handleMouseDown(row, col);
  };

  const handleContainerMouseUp = () => {
    if (selection.gridArea && selection.isSelecting) {
      const { rowStart, rowEnd, colStart } = selection.gridArea;

      const actualEnd = rowEnd - rowStart >= 1 ? rowEnd : rowStart + 1;

      // Check if any row in the selection is unavailable
      // const isSelectionValid = Array.from(
      //   { length: actualEnd - rowStart },
      //   (_, i) => actualEnd + i,
      // ).every((row) => isTimeAvailable(row, colStart - 1));

      // if (isSelectionValid) {
      const start = getTimeFromRowIndex(venue, rowStart, selectedDate);
      const end = getTimeFromRowIndex(venue, actualEnd, selectedDate);

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
          isException: null,
          recurringReservationId: null,
        },
      });
    }
    handleMouseUp();
  };

  if (!user) {
    return (
      <>
        <div {...getSharedGridStyle(timeLabels.length, venue.spaces.length)}>
          <div
            className="col-span-full row-span-full cursor-pointer"
            onClick={() => setAnonUserWarningOpen(true)}
          />
        </div>
        <AnonymousUserWarning
          isOpen={anonUserWarningOpen}
          onClose={() => setAnonUserWarningOpen(false)}
        />
      </>
    );
  }

  const { style, className } = getSharedGridStyle(
    timeLabels.length,
    venue.spaces.length,
  );

  return (
    <div
      style={style}
      className={`${className} cursor-pointer`}
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      {selection.gridArea && (
        <div
          className="bg-cyan-600/20 border border-teal-600/50 mx-1 my-0.5 rounded"
          style={{
            gridRow: `${selection.gridArea.rowStart} / ${selection.gridArea.rowEnd}`,
            gridColumn: `${selection.gridArea.colStart} / ${selection.gridArea.colEnd}`,
          }}
        />
      )}
    </div>
  );
};

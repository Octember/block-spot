import { useState } from "react";
import { Venue } from "wasp/entities";
import { useTimeLabels } from "./constants";
import { useSelectedDate } from "./providers/date-provider";
import { useScheduleContext } from "./providers/schedule-query-provider";
import { getSharedGridStyle } from "./reservations/constants";
import { getTimeFromRowIndex, getRowIndexFromMinutes } from "./reservations/utilities";

function getStartEndTime(
  venue: Venue,
  date: Date,
  selection: {
    start: { row: number; col: number };
    current: { row: number; col: number };
  },
): { start: Date; end: Date } {
  if (selection.start.row > selection.current.row) {
    const startTime = calculateTimeFromRow(venue, date, selection.current.row);
    const endTime = calculateTimeFromRow(venue, date, selection.start.row + 1);
    return { start: startTime, end: endTime };
  }

  const startTime = calculateTimeFromRow(venue, date, selection.start.row);
  const endTime = calculateTimeFromRow(venue, date, selection.current.row + 1);
  return { start: startTime, end: endTime };
}

const calculateTimeFromRow = (venue: Venue, date: Date, row: number): Date => {
  // Can cause bugs if date is mutated, need to clone it
  const result = new Date(date);
  const hoursMinutes = getTimeFromRowIndex(venue, row);

  result.setHours(hoursMinutes.getHours(), hoursMinutes.getMinutes(), 0, 0);
  return result;
};

interface GridSelectionProps {
  spaceCount: number;
  onSelectionComplete?: (start: Date, end: Date, spaceIndex: number) => void;
}

export const GridSelection: React.FC<GridSelectionProps> = ({
  spaceCount,
  onSelectionComplete,
}) => {
  const timeLabels = useTimeLabels();
  const { selectedDate } = useSelectedDate();
  const { venue, unavailabileBlocks } = useScheduleContext();

  const [selection, setSelection] = useState<{
    start: { row: number; col: number } | null;
    current: { row: number; col: number } | null;
  }>({ start: null, current: null });
  const [isSelecting, setIsSelecting] = useState(false);

  const isTimeAvailable = (row: number): boolean => {
    const timeInMinutes = getTimeFromRowIndex(venue, row).getHours() * 60 +
      getTimeFromRowIndex(venue, row).getMinutes();

    return !unavailabileBlocks.some(block =>
      timeInMinutes >= block.startTimeMinutes &&
      timeInMinutes < block.endTimeMinutes
    );
  };

  const handleMouseDown = (row: number, col: number) => {
    if (!isTimeAvailable(row)) {
      return;
    }

    setIsSelecting(true);
    setSelection({ start: { row, col }, current: { row, col } });
  };

  const handleMouseMove = (row: number, col: number) => {
    if (!isTimeAvailable(row)) {
      handleMouseUp();
      return;
    }

    if (isSelecting) {
      setSelection((prev) => ({ ...prev, current: { row, col } }));
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);

    if (selection.start && selection.current) {
      // Validate entire selection range
      const minRow = Math.min(selection.start.row, selection.current.row);
      const maxRow = Math.max(selection.start.row, selection.current.row);

      // Check if any row in the selection is unavailable
      const isSelectionValid = Array.from(
        { length: maxRow - minRow + 1 },
        (_, i) => minRow + i
      ).every(row => isTimeAvailable(row));


      if (isSelectionValid && onSelectionComplete) {
        const { start, end } = getStartEndTime(venue, selectedDate, {
          start: selection.start,
          current: selection.current
        });
        onSelectionComplete(start, end, selection.start.col);
      }
    }
    setSelection({ start: null, current: null });
  };

  const getGridCell = (row: number, col: number) => {
    if (!selection.start || !selection.current || !isSelecting) return "";
    if (!isTimeAvailable(row)) return "";

    const minRow = Math.min(selection.start.row, selection.current.row);
    const maxRow = Math.max(selection.start.row, selection.current.row);
    const minCol = Math.min(selection.start.col, selection.current.col);
    const maxCol = Math.max(selection.start.col, selection.current.col);

    if (row >= minRow && row <= maxRow && col >= minCol && col <= maxCol) {
      return "bg-pink-200 opacity-50";
    }
    return "";
  };

  return (
    <div
      {...getSharedGridStyle(timeLabels.length, spaceCount)}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsSelecting(false)}
    >
      {Array.from({ length: timeLabels.length * 12 }).map((_, row) =>
        Array.from({ length: spaceCount }).map((_, col) => (
          // Add ones to account for 1-based grid indexing
          <div
            key={`${row + 1}-${col}`}
            className={`${getGridCell(row + 1, col)} inset-1 z-10 rounded ${isTimeAvailable(row + 1) ? 'cursor-pointer' : ''}`}
            onMouseDown={() => handleMouseDown(row + 1, col)}
            onMouseMove={() => handleMouseMove(row + 1, col)}
          />
        )),
      )}
    </div>
  );
};

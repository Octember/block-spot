import { format } from "date-fns";
import { useState } from "react";
import { getSharedGridStyle, MinutesPerSlot } from "./reservations/constants";
import { useSelectedDate } from "./providers/date-provider";
import { useTimeLabels } from "./constants";
import { getTimeFromRowIndex } from "./reservations/utilities";
import { Venue } from "wasp/entities";
import { useScheduleContext } from "./providers/schedule-query-provider";

function getStartEndTime(
  venue: Venue,
  date: Date,
  selection: {
    start: { row: number; col: number };
    current: { row: number; col: number };
  },
): { start: Date; end: Date } {
  const isEqual = selection.start.row === selection.current.row;

  if (selection.start.row > selection.current.row) {
    const startTime = calculateTimeFromRow(
      venue,
      date,
      selection.current.row - 1,
    );
    const endTime = calculateTimeFromRow(
      venue,
      date,
      selection.start.row + (isEqual ? 1 : 0),
    );
    return { start: startTime, end: endTime };
  }

  const startTime = calculateTimeFromRow(venue, date, selection.start.row - 1);
  const endTime = calculateTimeFromRow(
    venue,
    date,
    selection.current.row + (isEqual ? 1 : 0),
  );
  return { start: startTime, end: endTime };
}

const calculateTimeFromRow = (venue: Venue, date: Date, row: number): Date => {
  // Can cause bugs if date is mutated, need to clone it
  const result = new Date(date);
  const hoursMinutes = getTimeFromRowIndex(venue, row);

  result.setHours(hoursMinutes.getHours(), hoursMinutes.getMinutes());
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
  const { venue } = useScheduleContext();

  const [selection, setSelection] = useState<{
    start: { row: number; col: number } | null;
    current: { row: number; col: number } | null;
  }>({ start: null, current: null });
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setSelection({ start: { row, col }, current: { row, col } });
  };

  const handleMouseMove = (row: number, col: number) => {
    if (isSelecting) {
      setSelection((prev) => ({ ...prev, current: { row, col } }));
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);

    if (selection.start && selection.current) {
      const { start, end } = getStartEndTime(venue, selectedDate, selection);

      if (onSelectionComplete) {
        onSelectionComplete(start, end, selection.start.col);
      }
    }
    setSelection({ start: null, current: null });
  };

  const getGridCell = (row: number, col: number) => {
    if (!selection.start || !selection.current || !isSelecting) return "";

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
          <div
            key={`${row}-${col}`}
            className={`${getGridCell(row, col)} inset-1 rounded cursor-pointer`}
            onMouseDown={() => handleMouseDown(row, col)}
            onMouseMove={() => handleMouseMove(row, col)}
          />
        )),
      )}
    </div>
  );
};

import { useDroppable } from "@dnd-kit/core";

function getColor(isOver: boolean, occupied: boolean) {
  if (occupied) {
    return "bg-red-100/20";
  }
  if (isOver) {
    return "bg-cyan-600/20 animate-pulse";
  }
  return "bg-transparent hover:bg-cyan-600/10 transition-colors duration-200";
}

export const DroppableSpace = ({
  spaceId,
  columnIndex,
  rowIndex,
  rowSpan,
  occupied,
}: {
  spaceId: string;
  columnIndex: number;
  rowIndex: number;
  rowSpan: number;
  occupied: boolean;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${spaceId}-${rowIndex}`,
    data: {
      spaceId,
      rowIndex,
      rowSpan,
      occupied,
    },
    disabled: occupied,
  });

  return (
    <li
      ref={setNodeRef}
      className={`${getColor(isOver, occupied)} h-full`}
      style={{
        gridRow: `${rowIndex} / span ${rowSpan}`,
        gridColumnStart: columnIndex + 1,
      }}
    />
  );
};

import { useDroppable } from "@dnd-kit/core";

function getColor(isOver: boolean, occupied: boolean) {
  if (isOver) {
    return "bg-cyan-600/20 animate-pulse";
  }

  return "";
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
      className={`${getColor(isOver, occupied)}`}
      style={{
        gridRow: `${rowIndex + 1} / span ${rowSpan}`,
        gridColumnStart: columnIndex + 1,
      }}
    />
  );
};

import { useDroppable } from "@dnd-kit/core";

function getColor(isOver: boolean, occupied: boolean) {
  if (isOver) {
    return "bg-violet-200 bg-opacity-50";
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

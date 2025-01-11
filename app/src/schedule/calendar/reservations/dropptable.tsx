import { useDroppable } from '@dnd-kit/core';

export const DroppableSpace = ({ spaceId, columnIndex, rowIndex, rowSpan }: { spaceId: string; columnIndex: number; rowIndex: number; rowSpan: number }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${spaceId}-${rowIndex}`,
    data: {
      spaceId,
      rowIndex,
    },
  });

  return <li ref={setNodeRef}
    className={`${isOver ? "bg-gray-300" : ""} border`}
    style={{
      gridRow: `${rowIndex + 1} / span ${rowSpan}`,
      gridColumnStart: columnIndex + 1,
    }}
  />
}
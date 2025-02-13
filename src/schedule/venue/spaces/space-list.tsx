import { Space } from "wasp/entities";
import { AddSpaceButton, SortableSpaceCard, SpaceCard } from "./space-card";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import {
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { updateSpacePriority } from "wasp/client/operations";
import { useToast } from "../../../client/toast";



export const SpaceList = ({
  venueId,
  spaces,
}: {
  venueId: string;
  spaces: Space[];
}) => {
  const initialSpaces = useMemo(() => spaces.toSorted((a, b) => a.priority - b.priority), [spaces]);

  const toast = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sortedSpaces, setSortedSpaces] = useState<Space[]>(initialSpaces);
  const activeSpace = useMemo(
    () => spaces.find((space) => space.id === activeId),
    [activeId, spaces],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => {
        const { active } = event;

        setActiveId(active.id as string);
      }}
      onDragEnd={async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
          const oldIndex = sortedSpaces.findIndex((space) => space.id === active.id);
          const newIndex = sortedSpaces.findIndex((space) => space.id === over?.id);

          const newSortedSpaces = arrayMove(sortedSpaces, oldIndex, newIndex);

          setSortedSpaces(newSortedSpaces);

          try {
            await updateSpacePriority({
              spaceUpdates: newSortedSpaces.map((space, index) => ({
                id: space.id,
                priority: index,
              })),
            });

            toast({
              title: "Spaces updated successfully",
              description: "The spaces have been updated",
            });
          } catch (error) {
            toast({
              type: "error",
              title: "Failed to update spaces",
              description: "The spaces could not be updated: " + error,
            });
          }
        }

        setActiveId(null);
      }}
    >
      <ul className="flex flex-col gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <SortableContext items={spaces} strategy={verticalListSortingStrategy}>
          {sortedSpaces.map((space) => (
            <SortableSpaceCard space={space} key={space.id} />
          ))}
        </SortableContext>
      </ul>

      <DragOverlay>
        {activeSpace && <SpaceCard space={activeSpace} />}
      </DragOverlay>
    </DndContext>
  );
};

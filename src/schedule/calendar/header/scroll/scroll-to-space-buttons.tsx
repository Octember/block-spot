import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { FC } from "react";
import { ButtonGroup } from "../../../../client/components/button-group";
import { Select } from "../../../../client/components/form/select";
import { useVenueContext } from "../../providers/venue-provider";
import { LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import { Button } from '@headlessui/react';
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { addDays } from "date-fns";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";

function isElementInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
    (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function scrollToSpace(index: number) {
  const spaceElement = document.getElementById(`space-${index}`);
  if (!spaceElement) {
    console.warn("Space element not found", index);
    return;
  } else {
    spaceElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => {
      spaceElement.focus({ preventScroll: true });
    }, 100);
  }
}

const getMaxVisibleSpaceIndex = () => {
  let maxIndex = 0;
  let spaceIndex = 0;

  while (true) {
    const spaceElement = document.getElementById(`space-${spaceIndex}`);
    if (!spaceElement) break;

    if (isElementInViewport(spaceElement)) {
      maxIndex = spaceIndex;
    }
    spaceIndex++;
  }

  return maxIndex;
};

const getMinVisibleSpaceIndex = () => {
  let minIndex = 0;
  let spaceIndex = 0;

  while (true) {
    const spaceElement = document.getElementById(`space-${spaceIndex}`);
    if (!spaceElement) break;

    if (isElementInViewport(spaceElement)) {
      minIndex = spaceIndex;
      break;
    }
    spaceIndex++;
  }

  return minIndex;
};

function scrollToNextSpace() {
  const maxVisibleSpaceIndex = getMaxVisibleSpaceIndex();
  scrollToSpace(maxVisibleSpaceIndex + 1);
}

function scrollToPreviousSpace() {
  const minVisibleSpaceIndex = getMinVisibleSpaceIndex();
  scrollToSpace(minVisibleSpaceIndex - 1);
}

export const ScrollToSpaceButtons: FC = () => {
  const { venue } = useVenueContext();

  return (
    <div className="flex pr-4 py-2 gap-2 items-center">
      <Select
        options={venue.spaces.map((space) => ({
          label: space.name,
          value: space.id,
        }))}
        onChange={(value) => {
          const index = venue.spaces.findIndex(
            (space) => space.id === value.value,
          );
          scrollToSpace(index);
        }}
        value={undefined}
        placeholder="View space..."
      />

      <ButtonGroup
        items={[
          {
            label: <ChevronLeftIcon className="size-4" />,
            onClick: scrollToPreviousSpace,
          },
          {
            label: <ChevronRightIcon className="size-4" />,
            onClick: scrollToNextSpace,
          },
        ]}
      />
    </div>
  );
};


export const FloatingButtons: FC = () => {
  const { setPendingChange } = usePendingChanges();
  const { user } = useAuthUser();
  const { venue } = useVenueContext();

  return (
    <div className="block md:hidden relative">
      <div className="fixed bottom-8 right-8 z-99 flex items-center gap-2">
        {/* Container with glass effect */}
        <div className="flex items-center bg-white bg-opacity-80 backdrop-blur-md rounded-full shadow-lg p-1">
          {/* Back button */}
          <Button
            onClick={scrollToPreviousSpace}
            className="flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LuChevronLeft size={20} />
          </Button>

          {/* Next button */}
          <Button
            onClick={scrollToNextSpace}
            className="flex items-center justify-center h-10 w-10 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LuChevronRight size={20} />
          </Button>
        </div>

        {/* Add/Create button (separate with highlight) */}
        <Button
          onClick={() => setPendingChange({
            type: "CREATE",
            newState: {
              id: "draft",
              spaceId: venue.spaces[0].id,
              startTime: new Date(),
              endTime: addDays(new Date(), 1),
              status: "PENDING",
              userId: "",
              createdAt: new Date(),
              updatedAt: new Date(),
              createdById: user?.id || "",
              description: "",
            }
          })}
          className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors">
          <LuPlus size={24} />
        </Button>
      </div>
    </div >
  );
};
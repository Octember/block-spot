import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { FC } from "react";
import { ButtonGroup } from "../../../../client/components/button-group";
import { Select } from "../../../../client/components/form/select";
import { useVenueContext } from "../../providers/venue-provider";
import { LuChevronLeft, LuChevronRight, LuPlus } from "react-icons/lu";
import { Button } from "@headlessui/react";
import { usePendingChanges } from "../../providers/pending-changes-provider";
import { addDays, addMinutes, roundToNearestMinutes } from "date-fns";
import { useAuthUser } from "../../../../auth/providers/AuthUserProvider";

function isElementInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right > 0
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

export const ScrollToSpaceButtons: FC = () => {
  const { venue } = useVenueContext();
  const { scrollToNextSpace, scrollToPreviousSpace } = useScrollToSpaceButtons(
    venue.spaces.length,
  );

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

function useScrollToSpaceButtons(numSpaces: number) {
  function scrollToNextSpace() {
    const maxVisibleSpaceIndex = getMaxVisibleSpaceIndex();
    console.log("maxVisibleSpaceIndex", maxVisibleSpaceIndex, numSpaces);
    if (maxVisibleSpaceIndex + 1 < numSpaces) {
      scrollToSpace(maxVisibleSpaceIndex);
    } else {
      scrollToSpace(0);
    }
  }

  function scrollToPreviousSpace() {
    const minVisibleSpaceIndex = getMinVisibleSpaceIndex();
    if (minVisibleSpaceIndex - 1 < 0) {
      scrollToSpace(numSpaces - 1);
    } else {
      scrollToSpace(minVisibleSpaceIndex - 1);
    }
  }

  return {
    scrollToNextSpace,
    scrollToPreviousSpace,
  };
}

export const FloatingButtons: FC = () => {
  const { setPendingChange } = usePendingChanges();
  const { user } = useAuthUser();
  const { venue } = useVenueContext();

  const { scrollToNextSpace, scrollToPreviousSpace } = useScrollToSpaceButtons(
    venue.spaces.length,
  );
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
          onClick={() =>
            setPendingChange({
              type: "CREATE",
              newState: {
                id: "draft",
                spaceId: venue.spaces[0].id,
                startTime: roundToNearestMinutes(new Date(), {
                  nearestTo: 15,
                  roundingMethod: "ceil",
                }),
                endTime: roundToNearestMinutes(addMinutes(new Date(), 60), {
                  nearestTo: 15,
                  roundingMethod: "ceil",
                }),
                status: "PENDING",
                userId: "",
                createdAt: new Date(),
                updatedAt: new Date(),
                createdById: user?.id || "",
                description: "",
              },
            })
          }
          className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <LuPlus size={24} />
        </Button>
      </div>
    </div>
  );
};

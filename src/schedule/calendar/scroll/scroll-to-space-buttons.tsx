import {
  ChevronLeftIcon,
  ChevronRightIcon
} from "@heroicons/react/20/solid";
import { FC } from "react";
import { ButtonGroup } from "../../../client/components/button-group";



function isElementInViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function scrollToSpace(spaceId: string) {
  const spaceElement = document.getElementById(spaceId);
  if (spaceElement) {
    spaceElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  const maxVisibleSpaceIndex = getMaxVisibleSpaceIndex();

  return (
    <div className="flex px-4 py-2 gap-2 items-center" >
      <div className="px-2 font-bold">
        Spaces
      </div>
      <ButtonGroup
        items={[
          {
            label: <ChevronLeftIcon className="size-5" />,
            onClick: () => {
              const minVisibleSpaceIndex = getMinVisibleSpaceIndex();
              if (minVisibleSpaceIndex > 0) {
                scrollToSpace(`space-${minVisibleSpaceIndex - 1}`);
              }
            }
          },
          {
            label: <ChevronRightIcon className="size-5" />,
            onClick: () => {
              const maxVisibleSpaceIndex = getMaxVisibleSpaceIndex();
              if (maxVisibleSpaceIndex < 100) {
                scrollToSpace(`space-${maxVisibleSpaceIndex + 1}`);
              }
            }
          },
        ]}
      />
    </div >
  );
};

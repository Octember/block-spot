import { useTimeLabels } from '../constants';

export const PixelsPerSlot = 16;
export const MinutesPerSlot = 15;

export function getSharedGridStyle(numSpaces: number) {
  const timeLabels = useTimeLabels();

  return {
    className: "col-start-1 col-end-2 row-start-1 grid sm:pr-8",
    style: {
      gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
      gridTemplateColumns: `repeat(${numSpaces}, minmax(0, 1fr))`,
    }
  }
}
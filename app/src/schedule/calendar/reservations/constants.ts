import { timeLabels } from '../constants';

export const PixelsPerSlot = 32;
export const MinutesPerSlot = 30;

export function getSharedGridStyle(numSpaces: number) {
  return {
    className: "col-start-1 col-end-2 row-start-1 grid sm:pr-8",
    style: {
      gridTemplateRows: `2rem repeat(${timeLabels.length * (60 / MinutesPerSlot)}, 2rem)`,
      gridTemplateColumns: `repeat(${numSpaces}, minmax(0, 1fr))`,
    }
  }
}

export const PixelsPerSlot = 16;
export const MinutesPerSlot = 15;

export const MinimumSlotWidth = "200px";

export function getGridTemplateColumns(numSpaces: number) {
  return `repeat(${numSpaces}, minmax(${MinimumSlotWidth}, 1fr))`;
}

export function getSharedGridStyle(timeLabelsCount: number, numSpaces: number) {
  return {
    className: "col-start-1 col-end-2 row-start-1 grid sm:pr-8",
    style: {
      gridTemplateRows: `2rem repeat(${timeLabelsCount * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
      gridTemplateColumns: getGridTemplateColumns(numSpaces),
    },
  };
}

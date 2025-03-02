// Constants for the time grid
export const PixelsPerSlot = 16;
export const MinutesPerSlot = 15;

// Constant for the minimum slot width in pixels.
export const MIN_SLOT_WIDTH = 140;
const TIMEZONE_SLOT_OFFSET = 56;

/**
 * Given the desired number of spaces (numSpaces) and the container width,
 * determine how many full columns can fit while honoring the minimum slot width.
 * If the computed width per slot would be less than the minimum,
 * we reduce the number of columns to fill the container evenly.
 */
function getEffectiveColumnCount(
  numSpaces: number,
  containerWidth: number,
): number {
  // For a single column, use 1 (which will fill 100% of the container).
  if (numSpaces === 1) return 1;

  // Calculate what the slot width would be if we used the desired number of columns.
  const computedSlotWidth = containerWidth / numSpaces;
  if (computedSlotWidth < MIN_SLOT_WIDTH) {
    // Not enough width for all numSpaces; show as many full slots as possible.
    return Math.max(Math.floor(containerWidth / MIN_SLOT_WIDTH), 1);
  }
  return numSpaces;
}

const IsMobile = window.innerWidth < 768;

function getWidthOffsetMobile(): number {
  return IsMobile ? MIN_SLOT_WIDTH / 2 : 0;
}

/**
 * Returns the grid-template-columns string.
 *
 * @param numSpaces - the desired number of spaces
 */
export function getGridTemplateColumns(numSpaces: number): string {
  const containerWidth = window.innerWidth - TIMEZONE_SLOT_OFFSET;
  const effectiveColumns = getEffectiveColumnCount(numSpaces, containerWidth);

  // Each column gets an equal fraction of the container width.
  const offset = getWidthOffsetMobile();

  const slotWidth = (containerWidth - offset) / effectiveColumns;
  return `repeat(${numSpaces}, ${slotWidth}px)`;
}

/**
 * Returns the shared grid style.
 *
 * @param timeLabelsCount - used to compute the number of rows
 * @param numSpaces - the desired number of spaces (columns)
 */
export function getSharedGridStyle(timeLabelsCount: number, numSpaces: number) {
  return {
    className: "col-start-1 col-end-2 row-start-1 grid",
    style: {
      // Compute the rows based on the timeLabelsCount and MinutesPerSlot.
      gridTemplateRows: `2rem repeat(${timeLabelsCount * (60 / MinutesPerSlot)}, ${PixelsPerSlot}px)`,
      // Compute columns so that they evenly fill the available container width.
      gridTemplateColumns: getGridTemplateColumns(numSpaces),
    },
  };
}

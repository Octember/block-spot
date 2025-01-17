import { test, expect } from "vitest";
import { getRowIndex, getTimeFromRowIndex } from "./utilities";
import { Venue } from "wasp/entities";

const mockVenue = {
  displayStart: 600,
  displayEnd: 1200,
} as Venue;

function getMockDate(minutes: number) {
  const date = new Date();
  date.setHours(0, minutes, 0, 0);
  return date;
}

function verifyMinutes(minutes: number) {
  const rowIndex = getRowIndex(mockVenue, getMockDate(minutes));
  const time = getTimeFromRowIndex(mockVenue, rowIndex);
  expect(time.getHours() * 60 + time.getMinutes()).toBe(minutes);
}

test("getRowIndex", () => {
  expect(getRowIndex(mockVenue, getMockDate(300))).toBe(1);

  for (let i = mockVenue.displayStart + 30; i < mockVenue.displayEnd; i += 15) {
    verifyMinutes(i);
  }
}); 

import { describe, expect, it } from "vitest";
import { HEART_LEVELS, preferenceAfterClick } from "@/lib/bucket-feedback";

describe("Five-heart preference", () => {
  it("offers exactly five levels and saves the selected level", () => {
    expect(HEART_LEVELS).toEqual([1, 2, 3, 4, 5]);
    for (const level of HEART_LEVELS) expect(preferenceAfterClick(0, level)).toBe(level);
    expect(() => preferenceAfterClick(0, 6)).toThrow(RangeError);
    expect(() => preferenceAfterClick(0, -1)).toThrow(RangeError);
  });
  it("clears the preference when the selected heart is clicked again", () => {
    expect(preferenceAfterClick(5, 5)).toBe(0);
    expect(preferenceAfterClick(3, 4)).toBe(4);
  });
});
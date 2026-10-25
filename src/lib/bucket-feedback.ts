export const HEART_LEVELS = [1, 2, 3, 4, 5] as const;

export function preferenceAfterClick(current: number, selected: number): number {
  if (!Number.isInteger(selected) || selected < 1 || selected > 5) {
    throw new RangeError("Preference must be between 1 and 5");
  }
  return current === selected ? 0 : selected;
}
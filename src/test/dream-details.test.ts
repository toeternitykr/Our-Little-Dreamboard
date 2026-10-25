import { describe, expect, it } from "vitest";
import { WRITERS, daysRemaining, countdownLabel, todayInSeoul } from "@/lib/dream-details";

describe("Shared dream details", () => {
  it("offers the two named writers without deriving them from the shared account", () => {
    expect(WRITERS).toEqual(["윤 용태", "김 정순"]);
  });
  it("counts calendar days to the exact target date including today and overdue dates", () => {
    expect(daysRemaining("2026-10-26", "2026-10-25")).toBe(1);
    expect(countdownLabel("2026-10-25", "2026-10-25")).toBe("오늘이 목표일 💕");
    expect(countdownLabel("2026-10-24", "2026-10-25")).toBe("1일 지남");
    expect(daysRemaining("2028-03-01", "2028-02-28")).toBe(2);
    expect(todayInSeoul(new Date("2026-10-25T16:00:00Z"))).toBe("2026-10-26");
  });
});
export const WRITERS = ["윤 용태", "김 정순"] as const;

export function daysRemaining(target: string, today: string): number {
  return Math.round((Date.parse(`${target}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

export function todayInSeoul(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function countdownLabel(target: string, today: string): string {
  const days = daysRemaining(target, today);
  return days === 0 ? "오늘이 목표일 💕" : days > 0 ? `${days}일 남음` : `${Math.abs(days)}일 지남`;
}
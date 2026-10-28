export type Item = { id: string; title: string; desc: string; year: string; done: boolean; doneAt?: string | undefined; doneShort?: string | undefined; color: number; preference: number; date: string | null; author: string };
export const NOTES = ["bg-note-1", "bg-note-2", "bg-note-3", "bg-note-4"];
export const EMOJIS = ["🌷", "✈️", "🏡", "🌙", "🍰", "🎡", "🌊", "⛺"];

export type Row = { id: string; title: string; description: string; target_year: string; done: boolean; done_at: string | null; color: number; preference: number; target_date: string | null; author_name: string };
export const toItem = (r: Row): Item => ({ id: r.id, date: r.target_date, author: r.author_name, title: r.title, desc: r.description, year: r.target_year, done: r.done, color: r.color, preference: r.preference, doneAt: r.done_at ? new Date(r.done_at).toLocaleDateString("ko-KR") : undefined, doneShort: r.done_at ? new Date(r.done_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }).replaceAll(" ", "") : undefined });

export function scheduleLabel(it: Item): string {
  return it.date ? it.date.replaceAll("-", ".") : `${it.year}년 목표`;
}

export const bySchedule = (a: Item, b: Item) => (a.date ?? a.year).localeCompare(b.date ?? b.year);
export const byDoneAt = (a: Item, b: Item) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "");

export function shortSchedule(it: Item): string {
  if (it.done) return it.doneShort ? `✨ ${it.doneShort}` : "✨ 완료";
  if (it.date) return it.date.slice(5).replaceAll("-", ".");
  return `${it.year}년`;
}




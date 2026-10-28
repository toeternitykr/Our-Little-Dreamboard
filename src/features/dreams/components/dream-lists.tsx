import { ChevronDown, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countdownLabel } from "../lib/dream-details";
import { EMOJIS, scheduleLabel, shortSchedule } from "../lib/dream-model";
import type { Item } from "../lib/dream-model";

function DreamPanel({ label, tab, items, empty, today, onOpen, onShowAll }: {
  label: string; tab: "todo" | "done"; items: Item[]; empty: string; today: string;
  onOpen: (item: Item) => void; onShowAll: (tab: "todo" | "done") => void;
}) {
  const preview = items.slice(0, 3);
  return (
    <section aria-label={`${label} 목록`} className="rounded-2xl bg-background/85 p-3 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="font-display text-sm">{label}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      {preview.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {preview.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => onOpen(it)}
                title={`${it.title} · ${scheduleLabel(it)}${!it.done && it.date ? ` · ${countdownLabel(it.date, today)}` : ""}`}
                className="flex w-full items-baseline gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-card/80 active:scale-[0.98]"
              >
                <span className="truncate text-xs leading-snug">{EMOJIS[it.title.length % EMOJIS.length]} {it.title}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{shortSchedule(it)}</span>
              </button>
            </li>
          ))}
        </ul>

      )}
      <Button
        type="button"
        variant="ghost"
        onClick={() => onShowAll(tab)}
        className="mt-1 w-full rounded-lg bg-muted/70 py-1 font-display text-[11px] transition hover:bg-muted active:scale-[0.98]"
      >
        전체 {items.length}개 보기
      </Button>

    </section>
  );
}

export function DreamSidebar({ open, onToggle, todo, done, today, onOpen, onShowAll }: {
  open: boolean | null; onToggle: (open: boolean) => void;
  todo: Item[]; done: Item[]; today: string;
  onOpen: (item: Item) => void;
  onShowAll: (tab: "todo" | "done") => void;
}) {
  if (open === null) return null;
  if (!open) return (
    <button
      onClick={() => onToggle(true)}
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-4 py-2 font-display text-sm shadow-soft backdrop-blur transition active:scale-95"
    >
      <List className="size-4" /> 꿈 목록
    </button>
  );
  return (
    <div className="fixed bottom-4 left-4 z-40 flex max-h-[78dvh] w-72 max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-y-auto pb-1">
      <div className="flex items-center justify-between px-1">
        <span className="font-display text-xs text-muted-foreground">📚 꿈 목록</span>
        <Button type="button" variant="ghost" size="icon" title="목록 접기" aria-label="목록 접기" onClick={() => onToggle(false)} className="size-6 rounded-full bg-background/80"><ChevronDown /></Button>
      </div>
      <DreamPanel label="🏃‍♂️ 우리의 꿈" tab="todo" items={todo} empty="아직 적은 꿈이 없어요" today={today} onOpen={onOpen} onShowAll={onShowAll} />
      <DreamPanel label="✨ 이룬 꿈" tab="done" items={done} empty="아직 이룬 꿈이 없어요" today={today} onOpen={onOpen} onShowAll={onShowAll} />
    </div>
  );
}

export function DreamListDialog({ label, items, today, onClose, onOpen }: {
  label: string; items: Item[]; today: string;
  onClose: () => void; onOpen: (item: Item) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm animate-in fade-in sm:items-center" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${label} 전체 목록`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-popover p-5 shadow-soft animate-in slide-in-from-bottom-10"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg">{label} <span className="text-sm text-muted-foreground">{items.length}</span></h2>
          <Button type="button" variant="ghost" size="icon" title="닫기" aria-label="닫기" onClick={onClose}><X /></Button>
        </div>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">아직 목록이 없어요 🌱</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {items.map((it) => (
              <li key={it.id}>
                <button onClick={() => onOpen(it)} className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-muted/70 active:scale-[0.99]">
                  <p className="truncate text-sm leading-snug">{EMOJIS[it.title.length % EMOJIS.length]} {it.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    ✍️ {it.author || "함께"} · 🗓️ {scheduleLabel(it)}
                    {!it.done && it.date && ` · ${countdownLabel(it.date, today)}`}
                    {it.done && it.doneAt && ` · ✨ ${it.doneAt}`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}



import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { countdownLabel } from "../lib/dream-details";
import { EMOJIS, scheduleLabel } from "../lib/dream-model";
import type { Item } from "../lib/dream-model";

export function DreamDetail({ item, today, onClose, onEdit }: {
  item: Item; today: string; onClose: () => void; onEdit: (item: Item) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm animate-in fade-in sm:items-center lg:items-start lg:justify-end lg:bg-foreground/10 lg:p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="꿈 자세히 보기"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg border border-glass-border bg-popover/95 p-6 shadow-soft backdrop-blur-md animate-in slide-in-from-bottom-10 lg:mt-16 lg:mr-2 lg:max-h-[80dvh] lg:w-72 lg:p-6 lg:slide-in-from-bottom-0 lg:slide-in-from-right-10"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h2 className="min-w-0 section-title lg:text-base">{EMOJIS[item.title.length % EMOJIS.length]} {item.title}</h2>
          <Button type="button" variant="ghost" size="icon" title="닫기" aria-label="닫기" onClick={onClose} className="lg:-mt-1 lg:-mr-1 shrink-0 lg:size-8"><X className="lg:size-4" /></Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">✍️ {item.author || "함께"}</p>
        {item.desc && <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{item.desc}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs lg:mt-5 lg:gap-2">
          <span className="rounded-full bg-muted px-3 py-1 font-medium lg:px-2 lg:py-0.5">🗓️ {scheduleLabel(item)}</span>
          {!item.done && item.date && <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground lg:px-2 lg:py-0.5">{countdownLabel(item.date, today)}</span>}
          {item.done && <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground lg:px-2 lg:py-0.5">✨ {item.doneAt}</span>}
        </div>
        <div className="mt-6 flex gap-2 lg:mt-6 lg:gap-3">
          <Button variant="ghost" onClick={onClose} className="min-w-0 flex-1 rounded-lg bg-muted py-3 lg:rounded-lg lg:py-2 lg:text-xs">닫기</Button>
          <Button onClick={() => onEdit(item)} className="min-w-0 flex-1 rounded-lg bg-primary py-3 font-display text-primary-foreground lg:rounded-lg lg:py-2 lg:text-xs">✏️ 수정하기</Button>
        </div>
      </section>
    </div>
  );
}

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
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-popover p-6 shadow-soft animate-in slide-in-from-bottom-10 lg:mt-16 lg:mr-2 lg:max-h-[80dvh] lg:w-72 lg:rounded-2xl lg:p-4 lg:slide-in-from-bottom-0 lg:slide-in-from-right-10"
      >
        <div className="flex items-start justify-between gap-1.5">
          <h2 className="font-display text-xl leading-snug lg:text-sm">{EMOJIS[item.title.length % EMOJIS.length]} {item.title}</h2>
          <Button type="button" variant="ghost" size="icon" title="닫기" aria-label="닫기" onClick={onClose} className="lg:-mt-1 lg:-mr-1 lg:size-7"><X className="lg:size-4" /></Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground lg:text-[11px]">✍️ {item.author || "함께"}</p>
        {item.desc && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90 lg:mt-2 lg:text-xs lg:leading-relaxed">{item.desc}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs lg:mt-3 lg:gap-1.5 lg:text-[11px]">
          <span className="rounded-full bg-muted px-3 py-1 font-medium lg:px-2 lg:py-0.5">🗓️ {scheduleLabel(item)}</span>
          {!item.done && item.date && <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground lg:px-2 lg:py-0.5">{countdownLabel(item.date, today)}</span>}
          {item.done && <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground lg:px-2 lg:py-0.5">✨ {item.doneAt}</span>}
        </div>
        <div className="mt-6 flex gap-2 lg:mt-4 lg:gap-1.5">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl bg-muted py-3 lg:rounded-lg lg:py-2 lg:text-xs">닫기</Button>
          <Button onClick={() => onEdit(item)} className="flex-1 rounded-xl bg-primary py-3 font-display text-primary-foreground lg:rounded-lg lg:py-2 lg:text-xs">✏️ 수정하기</Button>
        </div>
      </section>
    </div>
  );
}

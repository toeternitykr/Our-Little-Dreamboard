import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WRITERS } from "../lib/dream-details";
import type { Item } from "../lib/dream-model";

export function DreamEditor({ item, onClose, onSave, onDelete }: {
  item: Item | null; onClose: () => void;
  onSave: (d: { title: string; desc: string; year: string; date: string; author: string }) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [year, setYear] = useState(item?.year ?? String(new Date().getFullYear()));
  const [date, setDate] = useState(item?.date ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setBusy(true); setError("");
    try { await onSave({ title: title.trim(), desc: desc.trim(), year, date, author }); }
    catch (e) { setError(e instanceof Error ? e.message : "저장하지 못했어요."); }
    finally { setBusy(false); }
  };
  const field = "mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm animate-in fade-in sm:items-center" onClick={() => { if (!busy) onClose(); }}>
      <form
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={item ? "버킷리스트 수정" : "새로운 꿈 적기"}
        onSubmit={(e) => { e.preventDefault(); if (title.trim() && !busy) void submit(); }}
        className="max-h-[90dvh] overflow-y-auto w-full max-w-md rounded-t-3xl bg-popover p-6 shadow-soft animate-in slide-in-from-bottom-10 sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl">{item ? "✏️ 버킷리스트 수정" : "💌 새로운 꿈 적기"}</h2>
        <label className="mt-4 block text-sm">제목
          <input autoFocus className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 제주도 한 달 살기" required />
        </label>
        <label className="mt-3 block text-sm">간단한 설명
          <textarea className={field} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="어떤 모습이면 좋을까요?" />
        </label>
        <fieldset className="mt-3"><legend className="text-sm">작성자</legend><div className="mt-2 flex flex-wrap gap-2">{[...WRITERS, "함께"].map((name) => <Button key={name} type="button" variant={(author || "함께") === name ? "secondary" : "outline"} size="sm" aria-pressed={(author || "함께") === name} onClick={() => setAuthor(name === "함께" ? "" : name)}>{name}</Button>)}</div></fieldset>
        <label className="mt-3 block text-sm">목표 날짜
          <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {!date && <label className="mt-3 block text-sm">목표 연도
          <input type="number" className={field} value={year} onChange={(e) => setYear(e.target.value)} min={2000} max={2100} required />
        </label>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex gap-2">
          {item && (
            <Button type="button" disabled={busy} onClick={async () => { if (!confirm("이 꿈을 삭제할까요?")) return; setBusy(true); try { await onDelete(item.id); } catch (e) { setError(e instanceof Error ? e.message : "삭제하지 못했어요."); } finally { setBusy(false); } }} className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">
              🗑️ 삭제
            </Button>
          )}
          <Button variant="ghost" type="button" disabled={busy} onClick={onClose} className="flex-1 rounded-xl bg-muted py-3">취소</Button>
          <Button type="submit" disabled={busy} className="flex-1 rounded-xl bg-primary py-3 font-display text-primary-foreground">저장</Button>
        </div>
      </form>
    </div>
  );
}


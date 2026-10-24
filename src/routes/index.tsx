import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "우리의 버킷리스트 보드 💕" },
      { name: "description", content: "부부가 함께 해보고 싶은 것들을 기록하고 하나씩 이뤄가는 따뜻한 버킷리스트 보드" },
      { property: "og:title", content: "우리의 버킷리스트 보드 💕" },
      { property: "og:description", content: "함께 꿈꾸고, 함께 이뤄가요." },
    ],
  }),
  component: Index,
});

type Item = { id: string; title: string; desc: string; year: string; done: boolean; doneAt?: string; color: number };
const KEY = "couple-bucket-v1";
const NOTES = ["bg-note-1", "bg-note-2", "bg-note-3", "bg-note-4"];
const EMOJIS = ["🌷", "✈️", "🏡", "🌙", "🍰", "🎡", "🌊", "⛺"];

function Index() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [editing, setEditing] = useState<Item | null | "new">(null);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(items)); }, [items, loaded]);

  const complete = (id: string) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, done: true, doneAt: new Date().toLocaleDateString("ko-KR") } : i)));
    const colors = ["#f4a492", "#a8e0cf", "#fbe3a1", "#f7c6d0"];
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors }), 350);
  };

  const save = (data: Omit<Item, "id" | "done" | "color">) => {
    if (editing === "new") {
      setItems((p) => [{ ...data, id: crypto.randomUUID(), done: false, color: Math.floor(Math.random() * 4) }, ...p]);
      setTab("todo");
    } else if (editing) {
      setItems((p) => p.map((i) => (i.id === editing.id ? { ...i, ...data } : i)));
    }
    setEditing(null);
  };
  const remove = (id: string) => { setItems((p) => p.filter((i) => i.id !== id)); setEditing(null); };

  const todo = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const list = tab === "todo" ? todo : done;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <header className="text-center">
        <p className="text-3xl">👩‍❤️‍👨</p>
        <h1 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">우리의 버킷리스트</h1>
        <p className="mt-1 text-sm text-muted-foreground">함께 꿈꾸고, 하나씩 이뤄가요 🌙</p>
        <button
          onClick={() => setEditing("new")}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-lg text-primary-foreground shadow-soft transition active:scale-95 hover:-translate-y-0.5"
        >
          ＋ 새로운 버킷리스트 추가하기
        </button>
      </header>

      <nav className="sticky top-2 z-10 mx-auto mt-8 grid max-w-md grid-cols-2 gap-1 rounded-full border bg-card/90 p-1 shadow-soft backdrop-blur">
        {([["todo", "🏃‍♂️ 우리의 꿈", todo.length], ["done", "✨ 이룬 꿈", done.length]] as const).map(([k, label, n]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full py-2.5 font-display transition ${tab === k ? (k === "todo" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground") : "text-muted-foreground"}`}
          >
            {label} <span className="text-sm opacity-80">{n}</span>
          </button>
        ))}
      </nav>

      {list.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">
          <p className="text-5xl">{tab === "todo" ? "🌱" : "🎁"}</p>
          <p className="mt-3">{tab === "todo" ? "첫 번째 꿈을 적어볼까요?" : "아직 이룬 꿈이 없어요. 곧 채워질 거예요!"}</p>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((it, idx) => (
            <article
              key={it.id}
              onClick={() => setEditing(it)}
              className={`relative cursor-pointer rounded-2xl p-5 pt-7 shadow-soft transition hover:-translate-y-1 animate-in fade-in zoom-in-95 ${it.done ? "bg-card" : NOTES[it.color % 4]} ${idx % 2 ? "rotate-1" : "-rotate-1"} hover:rotate-0`}
            >
              <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-tape" />
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-xl leading-snug">
                  {EMOJIS[it.title.length % EMOJIS.length]} {it.title}
                </h3>
                {it.done && <span className="text-2xl">🏅</span>}
              </div>
              {it.desc && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{it.desc}</p>}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="rounded-full bg-card/70 px-3 py-1">🗓️ {it.year}년 목표</span>
                {it.done && <span className="text-muted-foreground">✨ {it.doneAt}</span>}
              </div>
              {!it.done && (
                <button
                  onClick={(e) => { e.stopPropagation(); complete(it.id); }}
                  className="mt-4 w-full rounded-xl bg-secondary py-2.5 font-display text-secondary-foreground transition active:scale-95 hover:brightness-95"
                >
                  🎉 완료하기
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {editing && (
        <Modal item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />
      )}
    </main>
  );
}

function Modal({ item, onClose, onSave, onDelete }: {
  item: Item | null; onClose: () => void;
  onSave: (d: { title: string; desc: string; year: string }) => void; onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [year, setYear] = useState(item?.year ?? String(new Date().getFullYear()));
  const field = "mt-1 w-full rounded-xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm animate-in fade-in sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), desc: desc.trim(), year }); }}
        className="w-full max-w-md rounded-t-3xl bg-popover p-6 shadow-soft animate-in slide-in-from-bottom-10 sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl">{item ? "✏️ 버킷리스트 수정" : "💌 새로운 꿈 적기"}</h2>
        <label className="mt-4 block text-sm">제목
          <input autoFocus className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 제주도 한 달 살기" required />
        </label>
        <label className="mt-3 block text-sm">간단한 설명
          <textarea className={field} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="어떤 모습이면 좋을까요?" />
        </label>
        <label className="mt-3 block text-sm">목표 연도
          <input type="number" className={field} value={year} onChange={(e) => setYear(e.target.value)} min={2000} max={2100} required />
        </label>
        <div className="mt-6 flex gap-2">
          {item && (
            <button type="button" onClick={() => confirm("이 꿈을 삭제할까요?") && onDelete(item.id)} className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive">
              🗑️ 삭제
            </button>
          )}
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-muted py-3">취소</button>
          <button type="submit" className="flex-1 rounded-xl bg-primary py-3 font-display text-primary-foreground">저장</button>
        </div>
      </form>
    </div>
  );
}

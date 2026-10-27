import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Images, X, Pencil, Trash2, ChevronDown, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreamPhotos } from "@/components/dream-photos";
import type { PhotoStore } from "@/components/dream-photos";
import { useDreamPhotos } from "@/hooks/use-dream-photos";
import { WRITERS, countdownLabel, todayInSeoul } from "@/lib/dream-details";
import confetti from "canvas-confetti";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import coupleBg from "@/assets/couple-bg.jpg.asset.json";
import { BucketFeedback } from "@/components/bucket-feedback";

function PhotoBg({ photos }: { photos: PhotoStore["photos"] }) {
  const backgrounds = photos.filter((p) => p.kind === "background");
  const sources = [coupleBg.url, ...backgrounds.map((p) => p.url)];
  const [active, setActive] = useState(0);
  const sourceKey = sources.join("|");
  useEffect(() => {
    setActive(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sources.length < 2 || reduced) return;
    const timer = setInterval(() => setActive((n) => (n + 1) % sources.length), 10000);
    return () => clearInterval(timer);
  }, [sourceKey]);
  return <div aria-hidden className="fixed inset-0 -z-10">
    {sources.map((url, index) => <img key={url} src={url} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-0"}`} />)}
    <div className="absolute inset-0 bg-background/12 backdrop-blur-[1px]" />
  </div>;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "우리(윤 용태, 김 정순)의 버킷리스트 💕" },
      { name: "description", content: "부부가 함께 해보고 싶은 것들을 기록하고 하나씩 이뤄가는 따뜻한 버킷리스트 보드" },
      { property: "og:title", content: "우리(윤 용태, 김 정순)의 버킷리스트 💕" },
      { property: "og:description", content: "함께 꿈꾸고, 함께 이뤄가요." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(coupleBg.url.startsWith("https://") ? [{ property: "og:image", content: coupleBg.url }, { name: "twitter:image", content: coupleBg.url }] : []),
    ],
  }),
  component: Index,
});

type Item = { id: string; title: string; desc: string; year: string; done: boolean; doneAt?: string | undefined; doneShort?: string | undefined; color: number; preference: number; date: string | null; author: string };
const NOTES = ["bg-note-1", "bg-note-2", "bg-note-3", "bg-note-4"];
const EMOJIS = ["🌷", "✈️", "🏡", "🌙", "🍰", "🎡", "🌊", "⛺"];

type Row = { id: string; title: string; description: string; target_year: string; done: boolean; done_at: string | null; color: number; preference: number; target_date: string | null; author_name: string };
const toItem = (r: Row): Item => ({ id: r.id, date: r.target_date, author: r.author_name, title: r.title, desc: r.description, year: r.target_year, done: r.done, color: r.color, preference: r.preference, doneAt: r.done_at ? new Date(r.done_at).toLocaleDateString("ko-KR") : undefined, doneShort: r.done_at ? new Date(r.done_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }).replaceAll(" ", "") : undefined });

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const photoStore = useDreamPhotos(session?.user.id);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-4xl animate-pulse">💕</div>;
  return (
    <>
      <PhotoBg photos={photoStore.photos} />
      {session ? <Board photoStore={photoStore} /> : <Login />}
    </>
  );
}

function Login() {
  const [err, setErr] = useState("");
  const signIn = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setErr("로그인에 실패했어요. 다시 시도해 주세요.");
  };
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm -rotate-1 rounded-3xl bg-note-1 p-8 text-center shadow-soft">
        <p className="text-5xl">👩‍❤️‍👨</p>
        <h1 className="mt-3 font-display text-xl">우리(윤 용태, 김 정순)의 버킷리스트</h1>
        <p className="mt-2 text-sm text-muted-foreground">함께 쓰는 계정으로 로그인하면<br />어디서든 같은 꿈을 볼 수 있어요 🌙</p>
        <Button variant="ghost" onClick={signIn} className="mt-6 w-full rounded-full bg-card py-3 font-display text-lg shadow-soft transition active:scale-95">
          🔑 구글로 로그인
        </Button>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      </div>
    </main>
  );
}

function Board({ photoStore }: { photoStore: PhotoStore }) {
  const [photoSettings, setPhotoSettings] = useState(false);
  const [boardError, setBoardError] = useState("");
  const [today, setToday] = useState(() => todayInSeoul());
  useEffect(() => { const timer = setInterval(() => setToday(todayInSeoul()), 60000); return () => clearInterval(timer); }, []);
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [editing, setEditing] = useState<Item | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detail, setDetail] = useState<Item | null>(null);
  const [listOpen, setListOpen] = useState<boolean | null>(null);
  const [listTab, setListTab] = useState<"todo" | "done" | null>(null);

  useEffect(() => { setListOpen(window.matchMedia("(min-width: 1024px)").matches); }, []);

  const load = async () => {
    const { data, error } = await supabase.from("bucket_items").select("*").order("created_at", { ascending: false });
    if (error) { setBoardError("꿈 목록을 불러오지 못했어요."); setLoaded(true); return; }
    setItems(((data ?? []) as Row[]).map(toItem));
    setLoaded(true);
  };
  useEffect(() => { load(); }, []);

  const complete = async (id: string) => {
    await supabase.from("bucket_items").update({ done: true, done_at: new Date().toISOString() }).eq("id", id);
    load();
    const colors = ["#f4a492", "#a8e0cf", "#fbe3a1", "#f7c6d0"];
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 }, colors });
    setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors }), 350);
  };

  const save = async (d: { title: string; desc: string; year: string; date: string; author: string }) => {
    const row = { title: d.title, description: d.desc, target_year: d.date ? d.date.slice(0, 4) : d.year, target_date: d.date || null, author_name: d.author };
    const result = editing === "new"
      ? await supabase.from("bucket_items").insert({ ...row, color: Math.floor(Math.random() * 4) })
      : editing ? await supabase.from("bucket_items").update(row).eq("id", editing.id) : null;
    if (result?.error) throw new Error("꿈을 저장하지 못했어요. 다시 시도해 주세요.");
    if (editing === "new") setTab("todo");
    setEditing(null);
    await load();
  };
  const remove = async (id: string) => {
    const paths = photoStore.photos.filter((p) => p.item_id === id).map((p) => p.storage_path);
    const { error } = await supabase.from("bucket_items").delete().eq("id", id);
    if (error) throw new Error("꿈을 삭제하지 못했어요.");
    if (paths.length) await supabase.storage.from("dream-photos").remove(paths);
    setEditing(null); await load(); await photoStore.reload();
  };
  const signOut = () => supabase.auth.signOut();

  const todo = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  const list = tab === "todo" ? todo : done;
  const todoSorted = [...todo].sort(bySchedule);
  const doneSorted = [...done].sort(byDoneAt);


  return (
    <main className={`mx-auto min-h-screen max-w-5xl px-4 pt-8 sm:px-6 ${listOpen ? "lg:pl-72 max-lg:pb-[46dvh]" : "pb-32"}`}>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="icon" title="배경 사진 관리" aria-label="배경 사진 관리" onClick={() => setPhotoSettings(true)}><Images /></Button>
        <Button onClick={signOut} className="rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">👋 로그아웃</Button>
      </div>
      <header className="mx-auto w-fit rounded-[1.5rem] bg-background/50 px-6 py-4 text-center shadow-soft backdrop-blur-[3px]">
        <p className="text-2xl">👩‍❤️‍👨</p>
        <h1 className="mt-1.5 font-display text-lg text-foreground sm:text-xl">우리(윤 용태, 김 정순)의 버킷리스트</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">함께 꿈꾸고, 하나씩 이뤄가요 🌙</p>
        <Button
          onClick={() => setEditing("new")}
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-display text-base text-primary-foreground shadow-soft transition active:scale-95 hover:-translate-y-0.5"
        >
          ＋ 새로운 버킷리스트 추가하기
        </Button>
      </header>

      <nav className="sticky top-2 z-10 mx-auto mt-6 grid max-w-sm grid-cols-2 gap-1 rounded-full border bg-card/80 p-1 shadow-soft backdrop-blur">
        {([["todo", "🏃‍♂️ 우리의 꿈", todo.length], ["done", "✨ 이룬 꿈", done.length]] as const).map(([k, label, n]) => (
          <Button
            key={k}
            variant="ghost"
            onClick={() => setTab(k)}
            className={`rounded-full py-2 font-display text-sm transition ${tab === k ? (k === "todo" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground") : "text-muted-foreground"}`}
          >
            {label} <span className="text-sm opacity-80">{n}</span>
          </Button>
        ))}
      </nav>

      {!loaded ? (
        <p className="mt-16 text-center text-4xl animate-pulse">🌷</p>
      ) : list.length === 0 ? (
        <div className="mx-auto mt-16 w-fit rounded-[2rem] bg-background/80 px-10 py-8 text-center text-base text-muted-foreground shadow-soft backdrop-blur-[3px]">
          <p className="text-5xl">{tab === "todo" ? "🌱" : "🎁"}</p>
          <p className="mt-3">{tab === "todo" ? "첫 번째 꿈을 적어볼까요?" : "아직 이룬 꿈이 없어요. 곧 채워질 거예요!"}</p>
        </div>
      ) : (
        <section className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((it, idx) => (
            <article
              key={it.id}
              onClick={() => setEditing(it)}
              className={`relative cursor-pointer rounded-2xl p-4 pt-6 shadow-soft transition hover:-translate-y-1 animate-in fade-in zoom-in-95 ${it.done ? "bg-card" : NOTES[it.color % 4]} ${idx % 2 ? "rotate-1" : "-rotate-1"} hover:rotate-0`}
            >
              <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 rounded-sm bg-tape" />
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg leading-snug">
                  {EMOJIS[it.title.length % EMOJIS.length]} {it.title}
                </h3>
                {it.done && <span className="text-2xl">🏅</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">✍️ {it.author || "함께"}</p>
              {it.desc && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{it.desc}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="rounded-full bg-muted px-3 py-1 font-medium">🗓️ {it.date ? it.date.replaceAll("-", ".") : `${it.year}년 목표`}</span>
                {it.done && <span className="font-medium text-muted-foreground">✨ {it.doneAt}</span>}
              </div>
              {it.date && !it.done && <p className="mt-2 text-xs font-medium text-muted-foreground">{countdownLabel(it.date, today)}</p>}
              {it.done && <DreamPhotos store={photoStore} kind="memory" itemId={it.id} />}
              {!it.done && (
                <Button
                  onClick={(e) => { e.stopPropagation(); complete(it.id); }}
                  className="mt-3.5 w-full rounded-xl bg-secondary py-2 font-display text-sm text-secondary-foreground transition active:scale-95 hover:brightness-95"
                >
                  🎉 완료하기
                </Button>
              )}
              <BucketFeedback itemId={it.id} preference={it.preference} onPreference={(preference) => setItems((current) => current.map((item) => item.id === it.id ? { ...item, preference } : item))} />
              <div className="mt-2 flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                <Button type="button" variant="ghost" size="icon" title="꿈 수정" aria-label="꿈 수정" disabled={deleting !== null} onClick={() => setEditing(it)}><Pencil /></Button>
                <Button type="button" variant="ghost" size="icon" title="꿈 삭제" aria-label="꿈 삭제" className="text-destructive" disabled={deleting !== null} onClick={async () => {
                  if (!confirm(`“${it.title}” 꿈을 삭제할까요? 답글과 기념 사진도 함께 삭제돼요.`)) return;
                  setDeleting(it.id); setBoardError("");
                  try { await remove(it.id); }
                  catch (e) { setBoardError(e instanceof Error ? e.message : "꿈을 삭제하지 못했어요."); }
                  finally { setDeleting(null); }
                }}><Trash2 /></Button>
              </div>
            </article>
          ))}
        </section>
      )}

      {(boardError || photoStore.error) && <p role="alert" className="mt-4 rounded-md bg-background/90 p-3 text-sm text-destructive">{boardError || photoStore.error}</p>}
      {photoSettings && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm" onClick={() => setPhotoSettings(false)}>
        <section role="dialog" aria-modal="true" aria-label="배경 사진 관리" className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-lg bg-popover p-5 shadow-soft" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between"><h2 className="font-display text-lg">우리의 배경 사진</h2><Button variant="ghost" size="icon" aria-label="배경 사진 닫기" onClick={() => setPhotoSettings(false)}><X /></Button></div>
          <img src={coupleBg.url} alt="기본 부부 사진" className="mt-3 h-28 w-full rounded-md object-cover" />
          <DreamPhotos store={photoStore} kind="background" />
          {photoStore.error && <p role="alert" className="mt-3 text-sm text-destructive">{photoStore.error}</p>}
        </section>
      </div>}
      {editing && (
        <Modal item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />
      )}
      <DreamSidebar open={listOpen} onToggle={setListOpen} todo={todoSorted} done={doneSorted} today={today} onOpen={setDetail} onShowAll={setListTab} />
      {listTab && (
        <DreamListDialog
          label={listTab === "todo" ? "🏃‍♂️ 우리의 꿈" : "✨ 이룬 꿈"}
          items={listTab === "todo" ? todoSorted : doneSorted}
          today={today}
          onClose={() => setListTab(null)}
          onOpen={setDetail}
        />
      )}
      {detail && (
        <DreamDetail item={detail} today={today} onClose={() => setDetail(null)} onEdit={(it) => { setDetail(null); setEditing(it); }} />
      )}


    </main>
  );
}

function Modal({ item, onClose, onSave, onDelete }: {
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

function scheduleLabel(it: Item): string {
  return it.date ? it.date.replaceAll("-", ".") : `${it.year}년 목표`;
}

const bySchedule = (a: Item, b: Item) => (a.date ?? a.year).localeCompare(b.date ?? b.year);
const byDoneAt = (a: Item, b: Item) => (b.doneAt ?? "").localeCompare(a.doneAt ?? "");

function shortSchedule(it: Item): string {
  if (it.done) return it.doneShort ? `✨ ${it.doneShort}` : "✨ 완료";
  if (it.date) return it.date.slice(5).replaceAll("-", ".");
  return `${it.year}년`;
}



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

function DreamSidebar({ open, onToggle, todo, done, today, onOpen, onShowAll }: {
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

function DreamListDialog({ label, items, today, onClose, onOpen }: {
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


function DreamDetail({ item, today, onClose, onEdit }: {
  item: Item; today: string; onClose: () => void; onEdit: (item: Item) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm animate-in fade-in sm:items-center" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="꿈 자세히 보기"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-popover p-6 shadow-soft animate-in slide-in-from-bottom-10"
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-display text-xl leading-snug">{EMOJIS[item.title.length % EMOJIS.length]} {item.title}</h2>
          <Button type="button" variant="ghost" size="icon" title="닫기" aria-label="닫기" onClick={onClose}><X /></Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">✍️ {item.author || "함께"}</p>
        {item.desc && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">{item.desc}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1 font-medium">🗓️ {scheduleLabel(item)}</span>
          {!item.done && item.date && <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">{countdownLabel(item.date, today)}</span>}
          {item.done && <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">✨ {item.doneAt}</span>}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl bg-muted py-3">닫기</Button>
          <Button onClick={() => onEdit(item)} className="flex-1 rounded-xl bg-primary py-3 font-display text-primary-foreground">✏️ 수정하기</Button>
        </div>
      </section>
    </div>
  );
}

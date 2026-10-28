import { useEffect, useState } from "react";
import { Images, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DreamPhotos } from "@/features/photos/components/dream-photos";
import type { PhotoStore } from "@/features/photos/components/dream-photos";
import { BucketFeedback } from "@/features/bucket/components/bucket-feedback";
import { countdownLabel, todayInSeoul } from "../lib/dream-details";
import { NOTES, EMOJIS, toItem, bySchedule, byDoneAt } from "../lib/dream-model";
import type { Item, Row } from "../lib/dream-model";
import { DreamEditor } from "./dream-editor";
import { DreamSidebar, DreamListDialog } from "./dream-lists";
import { DreamDetail } from "./dream-detail";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import coupleBg from "@/assets/couple-bg.jpg.asset.json";

export function Board({ photoStore }: { photoStore: PhotoStore }) {
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
    const colors = getComputedStyle(document.documentElement).getPropertyValue("--confetti-colors").split(",").map((color) => color.trim());
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
        <Button variant="outline" onClick={signOut} className="rounded-full px-4 py-1.5 text-sm">👋 로그아웃</Button>
      </div>
      <header className="mx-auto w-fit rounded-2xl border border-glass-border bg-background/85 px-6 py-4 text-center shadow-soft backdrop-blur-md">
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

      <nav className="sticky top-2 z-10 mx-auto mt-6 grid max-w-sm grid-cols-2 gap-1 rounded-full border border-glass-border bg-card/90 p-1 shadow-soft backdrop-blur-md">
        {([["todo", "🏃‍♂️ 우리의 꿈", todo.length], ["done", "✨ 이룬 꿈", done.length]] as const).map(([k, label, n]) => (
          <Button
            key={k}
            variant={tab === k ? (k === "todo" ? "default" : "secondary") : "ghost"}
            onClick={() => setTab(k)}
            className={`rounded-full py-2 font-display text-sm ${tab !== k ? "text-muted-foreground" : ""}`}
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
              className={`relative cursor-pointer rounded-lg border border-glass-border p-4 pt-6 shadow-soft backdrop-blur-md transition-[transform,box-shadow] duration-300 motion-reduce:transition-none motion-safe:hover:-translate-y-1 animate-in fade-in zoom-in-95 ${it.done ? "bg-card/95" : NOTES[it.color % 4]} ${idx % 2 ? "rotate-1" : "-rotate-1"} hover:rotate-0`}
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
                  variant="secondary"
                  onClick={(e) => { e.stopPropagation(); complete(it.id); }}
                  className="mt-3.5 w-full rounded-lg py-2 font-display text-sm"
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
        <DreamEditor item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save} onDelete={remove} />
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


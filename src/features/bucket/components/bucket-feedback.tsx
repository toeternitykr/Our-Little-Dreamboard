import { useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { HEART_LEVELS, preferenceAfterClick } from "@/features/bucket/lib/bucket-feedback";

export function BucketFeedback({ itemId, preference, onPreference }: {
  itemId: string;
  preference: number;
  onPreference: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Tables<"bucket_replies">[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError("");
    supabase.from("bucket_replies").select("*").eq("item_id", itemId).order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("답글을 불러오지 못했어요. 다시 열어 주세요.");
        else setReplies(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, [open, itemId]);

  const rate = async (selected: number) => {
    if (rating) return;
    setRating(true);
    setError("");
    const value = preferenceAfterClick(preference, selected);
    const { data, error } = await supabase.from("bucket_items").update({ preference: value }).eq("id", itemId).select("id").single();
    if (error || !data) setError("하트를 저장하지 못했어요. 다시 시도해 주세요.");
    else onPreference(value);
    setRating(false);
  };

  const send = async () => {
    const text = body.trim();
    if (!text || saving) return;
    setSaving(true);
    setError("");
    const { data, error } = await supabase.from("bucket_replies").insert({ item_id: itemId, body: text }).select("*").single();
    if (error || !data) setError("답글을 저장하지 못했어요. 다시 시도해 주세요.");
    else { setReplies((current) => [...current, data]); setBody(""); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("이 답글을 삭제할까요?")) return;
    setError("");
    const { data, error } = await supabase.from("bucket_replies").delete().eq("id", id).select("id").single();
    if (error || !data) setError("답글을 삭제하지 못했어요. 다시 시도해 주세요.");
    else setReplies((current) => current.filter((reply) => reply.id !== id));
  };

  return (
    <div className="mt-6 border-t pt-5" onClick={(event) => event.stopPropagation()}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <span className="min-w-0 text-xs leading-relaxed text-muted-foreground">선호도 {preference}/5</span>
        <div className="flex shrink-0 gap-0" role="group" aria-label="하트 선호도">
          {HEART_LEVELS.map((level) => (
            <Button key={level} type="button" variant="ghost" size="icon" disabled={rating}
              aria-label={`선호도 ${level}개`} aria-pressed={preference === level} title={`하트 ${level}개`}
              className={`h-8 w-8 ${level <= preference ? "text-destructive" : "text-muted-foreground"}`}
              onClick={() => rate(level)}>
              <Heart className={`size-5 ${level <= preference ? "fill-current" : ""}`} />
            </Button>
          ))}
        </div>
      </div>
      <Button type="button" variant="ghost" className="mt-3 px-0 hover:bg-transparent" aria-expanded={open} onClick={() => setOpen(!open)}>
        <MessageCircle /> 답글 {open ? replies.length : "보기"}
      </Button>
      {open && (
        <div className="mt-4">
          {loading ? <p className="text-sm text-muted-foreground" role="status">답글을 불러오는 중…</p> : (
            <div className="max-h-64 space-y-4 overflow-y-auto">
              {replies.length === 0 && <p className="text-sm text-muted-foreground">아직 답글이 없어요 💌</p>}
              {replies.map((reply) => (
                <div key={reply.id} className="border-b pb-2">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{reply.body}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <time className="text-xs text-muted-foreground" dateTime={reply.created_at}>{new Date(reply.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="답글 삭제" title="답글 삭제" onClick={() => remove(reply.id)}><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3" onSubmit={(event) => { event.preventDefault(); send(); }}>
            <textarea aria-label="답글 내용" placeholder="답글을 남겨 주세요" rows={2} maxLength={2000} value={body} disabled={saving}
              onChange={(event) => setBody(event.target.value)} className="min-w-0 w-full resize-y rounded-lg border bg-background px-3 py-3 text-base leading-relaxed outline-none focus:ring-2 focus:ring-ring" />
            <Button type="submit" size="icon" disabled={saving || !body.trim() || loading} aria-label="답글 보내기" title="답글 보내기" className="h-10 w-10 shrink-0"><Send /></Button>
          </form>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
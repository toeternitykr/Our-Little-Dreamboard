import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DreamPhoto = { id: string; item_id: string | null; kind: "background" | "memory"; storage_path: string; url: string };
const BUCKET = "dream-photos";

async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error("사진을 읽을 수 없어요. JPG, PNG 또는 WEBP 사진으로 다시 선택해 주세요."); });
  try {
    const ratio = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("사진을 준비하지 못했어요.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("사진을 준비하지 못했어요.")), "image/jpeg", 0.9));
  } finally { bitmap.close(); }
}

export function useDreamPhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<DreamPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!userId) { setPhotos([]); return; }
    const { data, error: readError } = await supabase.from("bucket_photos").select("*").order("created_at");
    if (readError) { setError("사진 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); return; }
    if (!data?.length) { setPhotos([]); return; }
    const { data: signed, error: signError } = await supabase.storage.from(BUCKET).createSignedUrls(data.map((p) => p.storage_path), 3600);
    if (signError) { setError("사진을 불러오지 못했어요."); return; }
    setPhotos(data.flatMap((p, index) => {
      const url = signed?.[index]?.signedUrl;
      return url && (p.kind === "background" || p.kind === "memory") ? [{ ...p, kind: p.kind, url } as DreamPhoto] : [];
    }));
    setError("");
  }, [userId]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 45 * 60 * 1000); return () => clearInterval(timer); }, [load]);
  const upload = async (files: FileList | File[], kind: "background" | "memory", itemId?: string) => {
    if (!userId || busy) return;
    setBusy(true); setError("");
    try {
      for (const file of Array.from(files)) {
        const blob = await preparePhoto(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error("사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
        const { error: insertError } = await supabase.from("bucket_photos").insert({ kind, item_id: itemId ?? null, storage_path: path });
        if (insertError) {
          await supabase.storage.from(BUCKET).remove([path]);
          throw new Error("사진을 저장하지 못했어요. 이룬 꿈인지 확인하고 다시 시도해 주세요.");
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : "사진을 올리지 못했어요."); }
    finally { await load(); setBusy(false); }
  };
  const remove = async (photo: DreamPhoto) => {
    if (busy) return;
    setBusy(true); setError("");
    const { error: deleteError } = await supabase.from("bucket_photos").delete().eq("id", photo.id);
    if (deleteError) setError("사진을 삭제하지 못했어요.");
    else {
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
    }
    setBusy(false);
  };
  return { photos, busy, error, upload, remove, reload: load };
}
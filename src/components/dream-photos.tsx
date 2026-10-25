import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DreamPhoto, useDreamPhotos } from "@/hooks/use-dream-photos";

export type PhotoStore = ReturnType<typeof useDreamPhotos>;

export function DreamPhotos({ store, kind, itemId }: { store: PhotoStore; kind: "background" | "memory"; itemId?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [viewing, setViewing] = useState<DreamPhoto | null>(null);
  const photos = store.photos.filter((photo) => photo.kind === kind && (kind === "background" || photo.item_id === itemId));
  return (
    <div className="mt-3" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{kind === "memory" ? "📷 그날의 추억" : "📷 배경 사진"}</span>
        <Button type="button" variant="ghost" size="sm" disabled={store.busy} onClick={() => input.current?.click()}><ImagePlus />{store.busy ? "사진 저장 중…" : "사진 추가"}</Button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden aria-label={kind === "memory" ? "기념 사진 선택" : "배경 사진 선택"} onChange={(event) => { if (event.target.files) void store.upload(event.target.files, kind, itemId); event.target.value = ""; }} />
      {photos.length > 0 && <div className="mt-2 grid grid-cols-3 gap-2">{photos.map((photo) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md">
        <Button type="button" variant="ghost" className="h-full w-full p-0" aria-label="사진 크게 보기" onClick={() => setViewing(photo)}><img src={photo.url} alt={kind === "memory" ? "이룬 꿈 기념 사진" : "우리 배경 사진"} className="h-full w-full object-cover" /></Button>
        <Button type="button" size="icon" variant="outline" className="absolute right-1 top-1 h-7 w-7 bg-background/90" title="사진 삭제" aria-label="사진 삭제" disabled={store.busy} onClick={() => { if (confirm("이 사진을 삭제할까요?")) void store.remove(photo); }}><Trash2 /></Button>
      </div>)}</div>}
      {viewing && createPortal(<div role="dialog" aria-modal="true" aria-label="사진 크게 보기" className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-5" onClick={(event) => { event.stopPropagation(); setViewing(null); }}>
        <Button type="button" variant="outline" size="icon" aria-label="사진 닫기" className="absolute right-4 top-4" onClick={() => setViewing(null)}><X /></Button>
        <img src={viewing.url} alt="우리의 추억" className="max-h-[85dvh] max-w-full object-contain" />
      </div>, document.body)}
    </div>
  );
}
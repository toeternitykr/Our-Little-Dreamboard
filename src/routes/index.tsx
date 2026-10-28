import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useDreamPhotos } from "@/features/photos/hooks/use-dream-photos";
import { PhotoBg } from "@/features/photos/components/photo-background";
import { Board } from "@/features/dreams/components/dream-board";
import { Login } from "@/features/auth/components/login";
import coupleBg from "@/assets/couple-bg.jpg.asset.json";

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


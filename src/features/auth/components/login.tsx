import { useState } from "react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";

export function Login() {
  const [err, setErr] = useState("");
  const signIn = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setErr("로그인에 실패했어요. 다시 시도해 주세요.");
  };
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-glass-border bg-card/95 p-8 text-center shadow-soft backdrop-blur-md">
        <p className="text-5xl">👩‍❤️‍👨</p>
        <h1 className="mt-3 font-display text-xl">우리(윤 용태, 김 정순)의 버킷리스트</h1>
        <p className="mt-2 text-sm text-muted-foreground">함께 쓰는 계정으로 로그인하면<br />어디서든 같은 꿈을 볼 수 있어요 🌙</p>
        <Button onClick={signIn} className="mt-6 w-full rounded-full py-3 font-display text-lg">
          🔑 구글로 로그인
        </Button>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      </div>
    </main>
  );
}


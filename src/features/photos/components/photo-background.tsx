import { useEffect, useState } from "react";
import type { PhotoStore } from "./dream-photos";
import coupleBg from "@/assets/couple-bg.jpg.asset.json";

export function PhotoBg({ photos }: { photos: PhotoStore["photos"] }) {
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
    <div className="absolute inset-0 bg-background/12 dark:bg-background/40" />
  </div>;
}


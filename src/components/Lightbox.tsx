"use client";

import { useCallback, useEffect, useState } from "react";
import type { Screenshot } from "@/db/schema";
import { Badge } from "./ui";

export function ScreenshotGallery({ shots }: { shots: Screenshot[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: number) => {
      setOpen((cur) => (cur == null ? cur : (cur + dir + shots.length) % shots.length));
    },
    [shots.length]
  );

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  if (shots.length === 0) return null;
  const current = open != null ? shots[open] : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shots.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setOpen(i)}
            className="group overflow-hidden rounded-xl border border-line bg-surface-2 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.url}
              alt={s.caption || s.chartType}
              className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="flex items-center justify-between gap-2 px-2.5 py-2">
              <span className="flex items-center gap-1.5">
                <Badge>{s.chartType}</Badge>
                {s.evidenceTag ? <Badge tone="accent">{s.evidenceTag}</Badge> : null}
              </span>
              {s.caption ? (
                <span className="truncate text-sm text-muted">{s.caption}</span>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.caption || current.chartType}
            className="max-h-[82vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="mt-3 flex items-center gap-3 rounded-full bg-surface px-4 py-2 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="text-muted hover:text-ink" onClick={() => step(-1)}>
              ← Prev
            </button>
            <span className="font-medium">{current.chartType}</span>
            {current.evidenceTag ? <span className="text-accent">· {current.evidenceTag}</span> : null}
            {current.caption ? <span className="text-muted">· {current.caption}</span> : null}
            <span className="text-faint">
              {(open ?? 0) + 1}/{shots.length}
            </span>
            <button type="button" className="text-muted hover:text-ink" onClick={() => step(1)}>
              Next →
            </button>
            <button type="button" className="text-muted hover:text-ink" onClick={close}>
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

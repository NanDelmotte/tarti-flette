// src/components/Shell.tsx
"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { paletteForGif } from "@/lib/palette";

type Props = {
  title?: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  tightCard?: boolean;
  paletteKey?: string | null;
};

function applyPaletteClass(paletteKey?: string | null) {
  const cls = (paletteKey || "").startsWith("palette-")
    ? paletteKey
    : paletteForGif(paletteKey);

  const el = document.documentElement;

  // remove existing palette-* classes
  Array.from(el.classList).forEach((c) => {
    if (c.startsWith("palette-")) el.classList.remove(c);
  });

  if (cls) el.classList.add(cls);
}


export default function Shell({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  children,
  tightCard = false,
  paletteKey,
}: Props) {
  const [liveKey, setLiveKey] = useState<string | null | undefined>(paletteKey);

  useEffect(() => {
    setLiveKey(paletteKey);
  }, [paletteKey]);

  useEffect(() => {
    applyPaletteClass(liveKey);
  }, [liveKey]);

  useEffect(() => {
    function onVibe(e: Event) {
      const ce = e as CustomEvent<{ gifKey?: string }>;
      setLiveKey(ce.detail?.gifKey);
    }

    window.addEventListener("cirklie:vibe", onVibe as EventListener);
    return () => window.removeEventListener("cirklie:vibe", onVibe as EventListener);
  }, []);

  return (
    <main className="c-page">
      <div className="c-wrap">
        {(backHref || title || subtitle) && (
          <div className="c-topbar">
            <div>
              {backHref ? (
                <Link href={backHref} className="c-back">
                  ← {backLabel}
                </Link>
              ) : null}
            </div>
            <div />
          </div>
        )}

        {(title || subtitle) && (
          <div style={{ marginBottom: "var(--space-3)" }}>
            {title ? <h1 className="c-title">{title}</h1> : null}
            {subtitle ? <p className="c-subtitle">{subtitle}</p> : null}
          </div>
        )}

        <div className={tightCard ? "c-card c-card--tight" : "c-card"}>
          {children}
        </div>
      </div>
    </main>
  );
}

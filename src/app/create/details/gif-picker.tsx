// src/app/create/details/gif-picker.tsx
"use client";

import { useState } from "react";

type Option = { key: string; label: string; emoji: string };

const OPTIONS: Option[] = [
  { key: "girly", label: "Girly", emoji: "🥂" },
  { key: "fiesta", label: "Fiesta", emoji: "💃" },
  { key: "zen", label: "Zen", emoji: "🫶" },
  { key: "classy", label: "Classy", emoji: "🎉" },
];

export default function GifPicker({
  name,
  initialKey,
}: {
  name: string; // "gif_key"
  initialKey?: string;
}) {
  const initial =
    initialKey && OPTIONS.some((o) => o.key === initialKey)
      ? initialKey
      : "girly";
  const [value, setValue] = useState(initial);

  function choose(next: string) {
    setValue(next);
    window.dispatchEvent(
      new CustomEvent("cirklie:vibe", { detail: { gifKey: next } })
    );
  }

  return (
    <div className="c-stack" style={{ gap: "var(--space-2)" }}>
      <input type="hidden" name={name} value={value} />

      <div className="c-stack" style={{ gap: "var(--space-2)" }}>
        {OPTIONS.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(o.key)}
              className={active ? "c-choice c-choice--active" : "c-choice"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 20, width: 26, textAlign: "center" }}>
                  {o.emoji}
                </div>
                <div style={{ fontWeight: 650, fontSize: 14 }}>{o.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

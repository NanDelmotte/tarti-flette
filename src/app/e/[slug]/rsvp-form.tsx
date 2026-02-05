// src/app/e/[slug]/rsvp-form.tsx
"use client";

import { useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { getOrSetGuestTokenCookie } from "@/lib/guestTokenClient";

export default function RsvpForm({ slug, disabled }: { slug: string; disabled: boolean }) {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [status, setStatus] = useState<"yes" | "maybe" | "no">("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    if (!name.trim()) {
      setErr("Please add your name.");
      return;
    }

    setBusy(true);
    try {
      const guestToken = getOrSetGuestTokenCookie();

      const { error } = await supabase.rpc("submit_rsvp", {
        p_slug: slug,
        p_status: status,
        p_name: name.trim(),
        p_email: email.trim() || null,
        p_message: message.trim() || null,
        p_guest_token: guestToken || null,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      window.location.href = `/e/${slug}/thanks?status=${encodeURIComponent(status)}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="c-stack">
      <div className="c-field">
        <div className="c-label">RSVP</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => setStatus("yes")}
            className={status === "yes" ? "c-choice c-choice--active" : "c-choice"}
          >
            Going
          </button>

          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => setStatus("maybe")}
            className={status === "maybe" ? "c-choice c-choice--active" : "c-choice"}
          >
            Maybe
          </button>

          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => setStatus("no")}
            className={status === "no" ? "c-choice c-choice--active" : "c-choice"}
          >
            No
          </button>
        </div>
      </div>

      <div className="c-field">
        <div className="c-label">Your name</div>
        <input
          disabled={disabled || busy}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          className="c-input"
        />
      </div>

      <div className="c-field">
        <div className="c-label">Email (optional)</div>
        <div className="c-help">Only used for event updates.</div>
        <input
          disabled={disabled || busy}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="c-input"
          inputMode="email"
          autoCapitalize="none"
        />
      </div>

      <div className="c-field">
        <div className="c-label">Message (optional)</div>
        <textarea
          disabled={disabled || busy}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Anything the host should know?"
          rows={3}
          className="c-textarea"
        />
      </div>

      {err ? <div className="c-error">{err}</div> : null}

      <button className="c-btnPrimary" disabled={disabled || busy} onClick={submit}>
        {busy ? "Sending…" : "Send RSVP"}
      </button>

      {disabled ? <div className="c-help">RSVPs are closed for this event.</div> : null}
    </section>
  );
}

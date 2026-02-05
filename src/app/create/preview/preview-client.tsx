// src/app/create/preview/preview-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Shell from "@/components/Shell";
import { formatEURange } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";

type EventSummary = {
  title: string;
  description: string | null;
  starts_at: string;
  ends_at?: string | null;
  location: string | null;
  gif_key?: string | null;
};

export default function PreviewClient({
  slug,
  mt,
  event,
  markSharedAction,
}: {
  slug: string;
  mt: string;
  event: EventSummary;
  markSharedAction: (formData: FormData) => Promise<void>;
}) {
  const publicPath = useMemo(() => `/e/${slug}`, [slug]);
  const managePath = useMemo(() => `/m/${mt}`, [mt]);
  const calendarPath = useMemo(() => `/e/${slug}/calendar.ics`, [slug]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const manageUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${managePath}`;
  }, [managePath]);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const paletteKey = useMemo(
    () => paletteForGif(event.gif_key ?? null),
    [event.gif_key]
  );

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { margin: 1, width: 240 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [shareUrl]);

  const dateLine = useMemo(
    () => formatEURange(event.starts_at, event.ends_at ?? null),
    [event.starts_at, event.ends_at]
  );

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  async function onShare() {
    if (!shareUrl) return;

    const shareText = `You're invited to "${event.title}".`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      // No explicit copy UI here; keep as compatibility fallback
      await copyToClipboard(shareUrl);
    }
  }

  const emailManageHref = useMemo(() => {
    const subject = `${event.title} — ${dateLine} — My management link`;
    const body = `My Cirklie event management link:\n\n${manageUrl}\n\n(Keep this link somewhere safe.)`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  }, [event.title, dateLine, manageUrl]);

  return (
    <Shell
      title="Ready to share"
      subtitle="Copy your links and send the invite."
      paletteKey={paletteKey}
      backHref="/create/details?step=5"
    >
      <div className="c-stack">
        <section className="c-section">
          <div style={{ fontWeight: 700, fontSize: 18 }}>{event.title}</div>

          {event.description ? (
            <div className="c-help">{event.description}</div>
          ) : null}
          <div className="c-help">{dateLine}</div>
          {event.location ? <div className="c-help">{event.location}</div> : null}

          <div style={{ marginTop: "var(--space-3)" }}>
            <a className="c-btnSecondary" href={calendarPath}>
              Save to calendar
            </a>
          </div>
        </section>

        <section className="c-section">
          <div className="c-label">RSVP link</div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="text" readOnly value={shareUrl} className="c-input" />
            <button className="c-btnPrimary" type="button" onClick={onShare}>
              Share with guests
            </button>
          </div>
        </section>

        <div className="c-divider" />

        <section className="c-section">
          <div className="c-label">Manage link</div>

          <input type="text" readOnly value={manageUrl} className="c-input" />

          <div className="c-help">
            This is the only time you’ll see this link. Save it somewhere safe.
          </div>

          <div className="c-actions">
            <a className="c-btnSecondary" href={emailManageHref}>
              Email it to myself
            </a>

            <a className="c-btnSecondary" href={managePath}>
              Open manage
            </a>
          </div>
        </section>

        <form action={markSharedAction}>
          <input type="hidden" name="mt" value={mt} />
          <input type="hidden" name="slug" value={slug} />
        </form>

        {qrDataUrl ? (
          <section style={{ display: "flex", justifyContent: "center" }}>
            <img
              src={qrDataUrl}
              alt="Invite QR code"
              style={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
              }}
            />
          </section>
        ) : null}
      </div>
    </Shell>
  );
}

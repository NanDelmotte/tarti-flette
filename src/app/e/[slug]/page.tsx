// src/app/e/[slug]/page.tsx
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatEURange } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";
import RsvpForm from "./rsvp-form";

export default async function EventRsvpPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServer();
  const { data } = await supabase.rpc("get_event_by_slug", { p_slug: params.slug });
  const e = data?.[0];

  if (!e) {
    return (
      <Shell title="Not found" subtitle="This invite link doesn’t match an event.">
        <div className="c-stack">
          <div className="c-help">Ask the host to resend the invite link.</div>
        </div>
      </Shell>
    );
  }

  const whenLine = formatEURange(e.starts_at, e.ends_at ?? null);
  const paletteKey = paletteForGif(e.gif_key ?? null);

  return (
    <Shell title={e.title} subtitle={whenLine} paletteKey={paletteKey} tightCard>
      <div className="c-stack">
        <section className="c-section">
          {e.host_name ? <div className="c-help">Hosted by {e.host_name}</div> : null}
          {e.location ? <div className="c-help">{e.location}</div> : null}

          {e.cover_image_url ? (
            <div className="c-mediaPreview" style={{ marginTop: "var(--space-2)" }}>
              <img
                src={e.cover_image_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : null}

          {e.description ? (
            <div className="c-help" style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
              {e.description}
            </div>
          ) : null}

          {e.status === "cancelled" ? (
            <div
              style={{
                padding: 10,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
                fontWeight: 650,
              }}
            >
              This event has been cancelled.
            </div>
          ) : null}
        </section>

        <div className="c-divider" />

        <section className="c-section">
          <RsvpForm slug={params.slug} disabled={e.status === "cancelled"} />
        </section>
      </div>
    </Shell>
  );
}

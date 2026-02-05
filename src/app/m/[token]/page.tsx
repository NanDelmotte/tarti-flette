// src/app/m/[token]/page.tsx
import Link from "next/link";
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatEU } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";

export default async function ManageHome({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams?: { sent?: string };
}) {
  const supabase = createSupabaseServer();
  const { data } = await supabase.rpc("get_event_by_manage_token", {
    p_manage_token: params.token,
  });
  const e = data?.[0];

  if (!e) {
    return (
      <Shell title="Invalid link" subtitle="This manage link doesn’t match an event.">
        <div className="c-stack">
          <section className="c-section">
            <div className="c-help">
              Open the manage URL you saved when you created the event.
            </div>
          </section>

          <Link href="/create" className="c-btnPrimary">
            Create a new event
          </Link>
        </div>
      </Shell>
    );
  }

  const paletteKey = paletteForGif(e.gif_key ?? null);

  const shareAgainHref = `/create/preview?slug=${encodeURIComponent(
    e.slug
  )}&mt=${encodeURIComponent(params.token)}`;

  const showSent = searchParams?.sent === "1";

  return (
    <Shell
      title="Manage"
      subtitle="Edit details, check RSVPs, or message guests."
      paletteKey={paletteKey}
    >
      <div className="c-stack">
        {showSent ? (
          <section
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3)",
              background: "var(--surface-strong)",
              fontWeight: 650,
            }}
          >
            Message queued to send.
            <div className="c-help" style={{ marginTop: 4 }}>
              It will go to guests who added an email.
            </div>
          </section>
        ) : null}

        {/* Event summary */}
        <section className="c-section">
          <div style={{ fontWeight: 700, fontSize: 18 }}>{e.title}</div>
          <div className="c-help">{formatEU(e.starts_at)}</div>
          {e.location ? <div className="c-help">{e.location}</div> : null}

          {e.status === "cancelled" ? (
            <div
              style={{
                marginTop: "var(--space-2)",
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
                fontWeight: 650,
              }}
            >
              Cancelled
            </div>
          ) : null}
        </section>

        {/* Primary actions */}
        <section className="c-section">
          <div className="c-sectionTitle">Actions</div>

          <div className="c-actions">
            <Link href={`/m/${params.token}/edit`} className="c-btnPrimary">
              Edit event
            </Link>

            <Link href={`/m/${params.token}/guests`} className="c-btnSecondary">
              See RSVPs & message guests
            </Link>

            <Link href={shareAgainHref} className="c-btnSecondary">
              Share link again
            </Link>
          </div>
        </section>

        {/* Footer actions */}
        <section className="c-section">
          <div className="c-actions">
            <Link href="/create/details" className="c-btnSecondary">
              Create new event
            </Link>

            <Link href={`/m/${params.token}/cancel`} className="c-btnSecondary">
              Cancel event
            </Link>
          </div>

          <div className="c-help">Creating a new event won’t affect this one.</div>
        </section>
      </div>
    </Shell>
  );
}

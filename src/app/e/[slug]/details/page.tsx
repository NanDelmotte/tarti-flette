// src/app/e/[slug]/details/page.tsx
import Link from "next/link";
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatEURange } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";

type Row = { name: string; status: "yes" | "maybe" | "no"; responded_at: string };

function splitByStatus(rows: Row[]) {
  const yes: Row[] = [];
  const maybe: Row[] = [];
  const no: Row[] = [];
  for (const r of rows) {
    if (r.status === "yes") yes.push(r);
    else if (r.status === "maybe") maybe.push(r);
    else no.push(r);
  }
  return { yes, maybe, no };
}

export default async function DetailsPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();

  const { data: ev } = await supabase.rpc("get_event_by_slug", { p_slug: params.slug });
  const e = ev?.[0];

  if (!e) {
    return (
      <Shell title="Not found" subtitle="This invite link doesn’t match an event.">
        <div className="c-stack">
          <div className="c-help">Ask the host to resend the invite link.</div>
        </div>
      </Shell>
    );
  }

  const { data: list } = await supabase.rpc("get_guest_list", { p_slug: params.slug });
  const rows = (list || []) as Row[];

  const latestByName = new Map<string, Row>();
  for (const r of rows) {
    const key = r.name.trim().toLowerCase();
    const prev = latestByName.get(key);
    if (!prev || new Date(r.responded_at).getTime() > new Date(prev.responded_at).getTime()) {
      latestByName.set(key, r);
    }
  }

  const deduped = Array.from(latestByName.values()).sort(
    (a, b) => new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime()
  );

  const grouped = splitByStatus(deduped);
  const whenLine = formatEURange(e.starts_at, e.ends_at ?? null);
  const paletteKey = paletteForGif(e.gif_key ?? null);

  return (
    <Shell
      title={e.title}
      subtitle={whenLine}
      paletteKey={paletteKey}
      backHref={`/e/${params.slug}`}
      backLabel="RSVP"
      tightCard
    >
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

        <section className="c-section">
          <div className="c-actions">
            <a className="c-btnSecondary" href={`/e/${params.slug}/calendar.ics`}>
              Save to calendar
            </a>

            <Link className="c-btnSecondary" href={`/e/${params.slug}`}>
              Change RSVP
            </Link>

            <Link className="c-btnSecondary" href="/create">
              Create your own event
            </Link>
          </div>
        </section>

        <div className="c-divider" />

        <section className="c-section">
          <div className="c-sectionTitle">Guest list</div>
          <GuestGroup title="Going" rows={grouped.yes} />
          <GuestGroup title="Maybe" rows={grouped.maybe} />
          <GuestGroup title="No" rows={grouped.no} />
        </section>
      </div>
    </Shell>
  );
}

function GuestGroup({ title, rows }: { title: string; rows: { name: string }[] }) {
  return (
    <section
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        background: "var(--surface)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: "var(--space-2)" }}>
        {title} ({rows.length})
      </div>

      {rows.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {rows.map((r, i) => (
            <span
              key={`${r.name}-${i}`}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {r.name}
            </span>
          ))}
        </div>
      ) : (
        <div className="c-help">—</div>
      )}
    </section>
  );
}

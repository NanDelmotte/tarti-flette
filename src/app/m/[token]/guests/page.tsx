// src/app/m/[token]/guests/page.tsx
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatEU } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";
import { redirect } from "next/navigation";

type Row = {
  name: string;
  status: "yes" | "maybe" | "no";
  responded_at: string;
  message?: string | null;
};

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

export default async function ManageGuestsAndMessage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createSupabaseServer();

  const { data: ev } = await supabase.rpc("get_event_by_manage_token", {
    p_manage_token: params.token,
  });
  const e = ev?.[0];

  if (!e) {
    return (
      <Shell title="Invalid link" subtitle="This manage link doesn’t match an event.">
        <div className="c-stack">
          <div className="c-help">Open the manage URL you saved when you created the event.</div>
        </div>
      </Shell>
    );
  }

  const { data: list } = await supabase.rpc("get_guest_list", { p_slug: e.slug });
  const rows = (list || []) as Row[];
  const grouped = splitByStatus(rows);

  const paletteKey = paletteForGif(e.gif_key ?? null);

  return (
    <Shell
      title="Guests"
      subtitle={e.title}
      backHref={`/m/${params.token}`}
      paletteKey={paletteKey}
    >
      <div className="c-stack">
        {/* RSVP Summary */}
        <section className="c-section">
          <div className="c-sectionTitle">RSVPs</div>

          <div className="c-actions c-actions--2col">
            <Stat label="Going" value={grouped.yes.length} />
            <Stat label="Maybe" value={grouped.maybe.length} />
            <Stat label="No" value={grouped.no.length} />
            <Stat label="Total" value={rows.length} />
          </div>
        </section>

        {/* RSVP Lists */}
        <section className="c-section">
          <Group title="Going" rows={grouped.yes} />
          <Group title="Maybe" rows={grouped.maybe} />
          <Group title="No" rows={grouped.no} />
        </section>

        <div className="c-divider" />

        {/* Message guests */}
        <section className="c-section">
          <div className="c-sectionTitle">Message guests</div>

          <form action={sendAction} className="c-stack">
            <input type="hidden" name="mt" value={params.token} />

            <div className="c-field">
              <div className="c-label">Subject (optional)</div>
              <input
                name="subject"
                placeholder={`Update from ${e.host_name}`}
                className="c-input"
              />
            </div>

            <div className="c-field">
              <div className="c-label">Message</div>
              <textarea name="body" required rows={6} className="c-textarea" />
              <div className="c-help">Sends to guests who added email (outbox only).</div>
            </div>

            <button className="c-btnPrimary" type="submit">
              Send message
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 12,
        background: "var(--surface-strong)",
        display: "grid",
        gap: 4,
      }}
    >
      <div className="c-help">{label}</div>
      <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
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
        <div className="c-stack" style={{ gap: "var(--space-2)" }}>
          {rows.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: 10,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--surface-strong)",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 650 }}>{r.name}</div>
                {r.message ? (
                  <div className="c-help" style={{ fontStyle: "italic" }}>
                    “{r.message}”
                  </div>
                ) : null}
              </div>

              <div className="c-help" style={{ whiteSpace: "nowrap" }}>
                {formatEU(r.responded_at)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="c-help">—</div>
      )}
    </section>
  );
}

async function sendAction(formData: FormData) {
  "use server";
  const supabase = createSupabaseServer();

  const mt = String(formData.get("mt") || "");
  const subject = String(formData.get("subject") || "").trim() || null;
  const body = String(formData.get("body") || "").trim();

  await supabase.rpc("send_host_message_by_manage_token", {
    p_manage_token: mt,
    p_subject: subject,
    p_body: body,
  });

  // feedback via dashboard query param
  redirect(`/m/${mt}?sent=1`);
}

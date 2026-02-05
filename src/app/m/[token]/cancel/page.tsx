// src/app/m/[token]/cancel/page.tsx
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatEU } from "@/lib/time";
import { paletteForGif } from "@/lib/palette";

export default async function ManageCancel({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createSupabaseServer();
  const { data } = await supabase.rpc("get_event_by_manage_token", {
    p_manage_token: params.token,
  });
  const e = data?.[0];

  if (!e) {
    return (
      <Shell title="Invalid link">
        <div className="c-help">
          This manage link doesn’t match an event.
        </div>
      </Shell>
    );
  }

  const paletteKey = paletteForGif(e.gif_key ?? null);

  return (
    <Shell
      title="Cancel event"
      subtitle="This action can’t be undone."
      backHref={`/m/${params.token}`}
      paletteKey={paletteKey}
    >
      <div className="c-stack">
        {/* Event summary */}
        <section
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-3)",
            background: "var(--surface-strong)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 16 }}>{e.title}</div>
          <div className="c-help">{formatEU(e.starts_at)}</div>

          <div
            className="c-help"
            style={{ marginTop: "var(--space-2)" }}
          >
            Cancelling will mark the event as cancelled and notify guests by email.
          </div>
        </section>

        {/* Confirmation */}
        <section className="c-section">
          <form action={cancelAction} className="c-stack">
            <input type="hidden" name="mt" value={params.token} />

            <button
              className="c-btnPrimary"
              style={{
                background: "#b91c1c",
                color: "#fff",
              }}
              type="submit"
            >
              Cancel event
            </button>

            <div className="c-help">
              You’ll return to the manage page after cancelling.
            </div>
          </form>
        </section>
      </div>
    </Shell>
  );
}

async function cancelAction(formData: FormData) {
  "use server";
  const supabase = createSupabaseServer();
  const mt = String(formData.get("mt") || "");

  await supabase.rpc("cancel_event_by_manage_token", {
    p_manage_token: mt,
  });

  redirect(`/m/${mt}`);
}

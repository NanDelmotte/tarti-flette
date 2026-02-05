// src/app/m/[token]/edit/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/Shell";
import { createSupabaseServer } from "@/lib/supabase/server";
import CoverUpload from "@/app/create/details/cover-upload";
import GifPicker from "@/app/create/details/gif-picker";
import { toUTCFromLocalAmsterdam, TZ } from "@/lib/time";
import { formatInTimeZone } from "date-fns-tz";

export default async function ManageEdit({
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
      <Shell title="Invalid link" subtitle="This manage link doesn’t match an event.">
        <div className="c-stack">
          <Link href="/" className="c-btnLink">
            Go home
          </Link>
        </div>
      </Shell>
    );
  }

  const startsLocal = toAmsterdamLocalInputValue(e.starts_at);
  const endsLocal = e.ends_at ? toAmsterdamLocalInputValue(e.ends_at) : "";
  const expiresLocal = e.expires_at ? toAmsterdamLocalInputValue(e.expires_at) : "";

  return (
    <Shell
  title="Edit"
  backHref={`/m/${params.token}`}
  paletteKey={e.gif_key}
>
      <form
        action={saveAction}
        className="c-stack"
        style={{ gap: "var(--space-4)" }}
      >
        <input type="hidden" name="mt" value={params.token} />

        <div className="c-section" style={{ gap: "var(--space-3)" }}>
          <div className="c-sectionTitle">Basics</div>

          <div className="c-stack">
            <label className="c-field">
              <div className="c-label">Event title</div>
              <input name="title" defaultValue={e.title} required className="c-input" />
            </label>

            <label className="c-field">
              <div className="c-label">Location (optional)</div>
              <input name="location" defaultValue={e.location || ""} className="c-input" />
            </label>
          </div>
        </div>

        <div className="c-section" style={{ gap: "var(--space-3)" }}>
          <div className="c-sectionTitle">Time</div>

          <div className="c-stack">
            <label className="c-field">
              <div className="c-label">Start</div>
              <input
                name="starts_at"
                type="datetime-local"
                defaultValue={startsLocal}
                required
                className="c-input"
              />
            </label>

            <label className="c-field">
              <div className="c-label">End (optional)</div>
              <input
                name="ends_at"
                type="datetime-local"
                defaultValue={endsLocal}
                className="c-input"
              />
            </label>
          </div>
        </div>

        <div className="c-section" style={{ gap: "var(--space-3)" }}>
          <div className="c-sectionTitle">Details</div>

          <label className="c-field">
            <div className="c-label">Details (optional)</div>
            <textarea
              name="description"
              defaultValue={e.description || ""}
              rows={4}
              className="c-textarea"
            />
          </label>
        </div>

        <div className="c-section" style={{ gap: "var(--space-3)" }}>
          <div className="c-sectionTitle">Media</div>

          <div className="c-stack" style={{ gap: "var(--space-3)" }}>
            <div className="c-field">
              <div className="c-label">Cover image (optional)</div>
              <div className="c-help">Shown at the top of your event.</div>
              <CoverUpload name="cover_image_url" initialUrl={e.cover_image_url || ""} />
            </div>

            <div className="c-field">
              <div className="c-label">Vibe</div>
              <div className="c-help">Affects the GIF and page colors.</div>
              <GifPicker name="gif_key" initialKey={e.gif_key || "confetti"} />
            </div>
          </div>
        </div>

        <div className="c-section" style={{ gap: "var(--space-3)" }}>
          <div className="c-sectionTitle">Sharing</div>

          <label className="c-field">
            <div className="c-label">Link expiry (optional)</div>
            <input
              name="expires_at"
              type="datetime-local"
              defaultValue={expiresLocal}
              className="c-input"
            />
          </label>
        </div>

        <button className="c-btnPrimary">Save changes</button>
      </form>
    </Shell>
  );
}

async function saveAction(formData: FormData) {
  "use server";
  const supabase = createSupabaseServer();

  const mt = String(formData.get("mt") || "");
  const title = String(formData.get("title") || "").trim();

  const startsAtLocal = String(formData.get("starts_at") || "").trim();
  const starts_at = toUTCFromLocalAmsterdam(startsAtLocal);

  const endsAtLocal = String(formData.get("ends_at") || "").trim();
  const ends_at = endsAtLocal ? toUTCFromLocalAmsterdam(endsAtLocal) : null;

  const location = String(formData.get("location") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;

  const coverVal = formData.get("cover_image_url");
  const cover_image_url = coverVal === null ? null : String(coverVal).trim();

  const gif_key = String(formData.get("gif_key") || "").trim() || null;

  const expiresAtLocal = String(formData.get("expires_at") || "").trim();
  const expires_at = expiresAtLocal ? toUTCFromLocalAmsterdam(expiresAtLocal) : null;

  await supabase.rpc("update_event_by_manage_token", {
    p_manage_token: mt,
    p_title: title,
    p_starts_at: starts_at,
    p_ends_at: ends_at,
    p_location: location,
    p_description: description,
    p_cover_image_url: cover_image_url,
    p_expires_at: expires_at,
    p_gif_key: gif_key,
  });

  redirect(`/m/${mt}`);
}

function toAmsterdamLocalInputValue(iso: string) {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd'T'HH:mm");
}

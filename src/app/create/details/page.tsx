// src/app/create/details/page.tsx
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { paletteForGif } from "@/lib/palette";
import { createSupabaseServer } from "@/lib/supabase/server";
import CoverUpload from "@/app/create/details/cover-upload";
import GifPicker from "@/app/create/details/gif-picker";
import { toUTCFromLocalAmsterdam } from "@/lib/time";

type Draft = {
  title?: string;
  starts_at?: string;
  duration_minutes?: string;
  ends_at?: string;
  location?: string;
  description?: string;
  cover_image_url?: string;
  gif_key?: string;
  host_name?: string;
  keyword?: string;
  expires_in_days?: string;
};

function getDraftFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): Draft {
  const get = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    title: get("title"),
    starts_at: get("starts_at"),
    duration_minutes: get("duration_minutes"),
    ends_at: get("ends_at"),
    location: get("location"),
    description: get("description"),
    cover_image_url: get("cover_image_url"),
    gif_key: get("gif_key"),
    host_name: get("host_name"),
    keyword: get("keyword"),
    expires_in_days: get("expires_in_days"),
  };
}

function hiddenDraftInputs(draft: Draft, exclude: (keyof Draft)[] = []) {
  const keys: (keyof Draft)[] = [
    "title",
    "starts_at",
    "duration_minutes",
    "ends_at",
    "location",
    "description",
    "cover_image_url",
    "gif_key",
    "host_name",
    "keyword",
    "expires_in_days",
  ];
  return (
    <>
      {keys
        .filter((k) => !exclude.includes(k))
        .map((k) => (
          <input
            key={k}
            type="hidden"
            name={k}
            value={(draft[k] ?? "") as string}
          />
        ))}
    </>
  );
}

function BackLink({ draft, toStep }: { draft: Draft; toStep: number }) {
  const qs = new URLSearchParams();
  qs.set("step", String(toStep));
  Object.entries(draft).forEach(([k, v]) => {
    if (typeof v === "string" && v.length) qs.set(k, v);
  });

  return (
    <a href={`/create/details?${qs.toString()}`} className="c-btnSecondary">
      Back
    </a>
  );
}

function computeEndsAtUTCISO(startsAtLocal: string, durationMinutes: number) {
  const startsUtcIso = toUTCFromLocalAmsterdam(startsAtLocal);
  if (!startsUtcIso) return null;

  const startUtc = new Date(startsUtcIso);
  if (!isFinite(startUtc.getTime())) return null;

  const endUtc = new Date(startUtc.getTime() + durationMinutes * 60 * 1000);
  if (!isFinite(endUtc.getTime())) return null;

  return endUtc.toISOString();
}

export default function CreateDetailsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const stepRaw = Array.isArray(searchParams.step)
    ? searchParams.step[0]
    : searchParams.step;

  const step = Math.min(5, Math.max(1, Number(stepRaw || "1")));
  const draft = getDraftFromSearchParams(searchParams);

  const paletteKey = paletteForGif(draft.gif_key || null);
  const stepLabel = `Step ${step} of 5`;

  if (step === 1) {
    return (
      <Shell title="Title" subtitle={stepLabel} paletteKey={paletteKey}>
        <form action={step1Action} className="c-stack">
          <label className="c-field">
            <div className="c-label">Event title</div>
            <input
              name="title"
              required
              defaultValue={draft.title || ""}
              placeholder="e.g. Dinner chez Nancy"
              className="c-input"
              autoFocus
            />
          </label>

          <button className="c-btnPrimary">Continue</button>
        </form>
      </Shell>
    );
  }

  if (step === 2) {
    return (
      <Shell title="When" subtitle={stepLabel} paletteKey={paletteKey}>
        <form action={step2Action} className="c-stack">
          {hiddenDraftInputs(draft, ["starts_at", "duration_minutes", "ends_at"])}

          <label className="c-field">
            <div className="c-label">Start</div>
            <input
              name="starts_at"
              type="datetime-local"
              required
              defaultValue={draft.starts_at || ""}
              className="c-input"
              autoFocus
            />
          </label>

          <label className="c-field">
            <div className="c-label">Duration</div>
            <div className="c-help">You can change this later.</div>
            <select
              name="duration_minutes"
              defaultValue={draft.duration_minutes || "120"}
              className="c-select"
            >
              <option value="1">Whenever</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1h 30m</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
              <option value="240">4 hours</option>
            </select>
          </label>

          <div className="c-actions">
            <BackLink draft={draft} toStep={1} />
            <button className="c-btnPrimary">Continue</button>
          </div>
        </form>
      </Shell>
    );
  }

  if (step === 3) {
    return (
      <Shell title="Details" subtitle={stepLabel} paletteKey={paletteKey}>
        <form action={step3Action} className="c-stack">
          {hiddenDraftInputs(draft, ["location", "description"])}

          <label className="c-field">
            <div className="c-label">Location (optional)</div>
            <input
              name="location"
              defaultValue={draft.location || ""}
              placeholder="e.g. My place"
              className="c-input"
              autoFocus
            />
          </label>

          <label className="c-field">
            <div className="c-label">Notes (optional)</div>
            <textarea
              name="description"
              defaultValue={draft.description || ""}
              rows={3}
              placeholder="Anything people should know?"
              className="c-textarea"
            />
          </label>

          <div className="c-actions">
            <BackLink draft={draft} toStep={2} />
            <button className="c-btnPrimary">Continue</button>
          </div>
        </form>
      </Shell>
    );
  }

  if (step === 4) {
    return (
      <Shell title="Vibe" subtitle={stepLabel} paletteKey={paletteKey}>
        <form action={step4Action} className="c-stack">
          {hiddenDraftInputs(draft, ["cover_image_url", "gif_key"])}

          <div className="c-section">
            <div className="c-label">Cover image (optional)</div>
            <div className="c-help">Shown at the top of your event.</div>
            <CoverUpload
              name="cover_image_url"
              initialUrl={draft.cover_image_url || ""}
            />
          </div>

          <div className="c-section">
            <div className="c-label">Choose a vibe</div>
            <GifPicker name="gif_key" initialKey={draft.gif_key || "zen"} />
          </div>

          <div className="c-actions">
            <BackLink draft={draft} toStep={3} />
            <button className="c-btnPrimary">Continue</button>
          </div>
        </form>
      </Shell>
    );
  }

  return (
    <Shell title="Host + link" subtitle={stepLabel} paletteKey={paletteKey}>
      <form action={step5CreateAction} className="c-stack">
        {hiddenDraftInputs(draft, ["host_name", "keyword", "expires_in_days"])}

        <label className="c-field">
          <div className="c-label">Host name</div>
          <input
            name="host_name"
            required
            defaultValue={draft.host_name || ""}
            placeholder="Your name"
            className="c-input"
            autoFocus
          />
        </label>

        <label className="c-field">
          <div className="c-label">Keyword</div>
          <div className="c-help">Used in your invite link.</div>
          <input
            name="keyword"
            required
            defaultValue={draft.keyword || ""}
            placeholder="e.g. friday-drinks"
            className="c-input"
          />
        </label>

        <label className="c-field">
          <div className="c-label">Link expires</div>
          <div className="c-help">Default 30 days.</div>
          <input
            name="expires_in_days"
            type="number"
            min={0}
            defaultValue={draft.expires_in_days || "30"}
            className="c-input"
          />
        </label>

        <div className="c-actions">
          <BackLink draft={draft} toStep={4} />
          <button className="c-btnPrimary">Create invite</button>
        </div>
      </form>
    </Shell>
  );
}

/* server actions */

async function step1Action(formData: FormData) {
  "use server";
  const title = String(formData.get("title") || "").trim();
  redirect(`/create/details?step=2&title=${encodeURIComponent(title)}`);
}

async function step2Action(formData: FormData) {
  "use server";

  const startsAtLocal = String(formData.get("starts_at") || "").trim();
  const durationMinutesRaw = String(formData.get("duration_minutes") || "120").trim();
  const durationMinutes = Number(durationMinutesRaw);

  const endsISO =
    isFinite(durationMinutes) && durationMinutes > 0
      ? computeEndsAtUTCISO(startsAtLocal, durationMinutes)
      : null;

  const sp = new URLSearchParams();
  sp.set("step", "3");
  for (const [k, v] of formData.entries()) sp.set(k, String(v));
  if (endsISO) sp.set("ends_at", endsISO);

  redirect(`/create/details?${sp.toString()}`);
}

async function step3Action(formData: FormData) {
  "use server";
  const sp = new URLSearchParams();
  sp.set("step", "4");
  for (const [k, v] of formData.entries()) sp.set(k, String(v));
  redirect(`/create/details?${sp.toString()}`);
}

async function step4Action(formData: FormData) {
  "use server";
  const sp = new URLSearchParams();
  sp.set("step", "5");
  for (const [k, v] of formData.entries()) sp.set(k, String(v));
  redirect(`/create/details?${sp.toString()}`);
}

async function step5CreateAction(formData: FormData) {
  "use server";
  const supabase = createSupabaseServer();

  const title = String(formData.get("title") || "").trim();

  const startsAtLocal = String(formData.get("starts_at") || "").trim();
  const starts_at = toUTCFromLocalAmsterdam(startsAtLocal);

  const durationMinutesRaw = String(formData.get("duration_minutes") || "120").trim();
  const durationMinutes = Number(durationMinutesRaw);

  const ends_at =
    startsAtLocal && isFinite(durationMinutes) && durationMinutes > 0
      ? computeEndsAtUTCISO(startsAtLocal, durationMinutes)
      : null;

  const location = String(formData.get("location") || "").trim() || null;
  const description = String(formData.get("description") || "").trim() || null;
  const cover_image_url = String(formData.get("cover_image_url") || "").trim() || null;

  const gif_key_raw = String(formData.get("gif_key") || "").trim();
  const gif_key = gif_key_raw || null;

  const host_name = String(formData.get("host_name") || "").trim();
  const keyword = String(formData.get("keyword") || "").trim();
  const expires_in_days = Number(String(formData.get("expires_in_days") || "30"));

  const { data, error } = await supabase.rpc("create_event_draft", {
    p_title: title,
    p_starts_at: starts_at,
    p_ends_at: ends_at,
    p_location: location,
    p_description: description,
    p_host_name: host_name,
    p_keyword: keyword,
    p_cover_image_url: cover_image_url,
    p_gif_key: gif_key,
    p_expires_in_days: isFinite(expires_in_days) ? expires_in_days : 30,
  });

  const row: any = Array.isArray(data) ? data[0] : data;
  const slug: string | undefined = row?.slug;
  const manageToken: string | undefined =
    row?.manageToken ?? row?.managetoken ?? row?.manage_token;

  if (error || !slug || !manageToken) {
    redirect(`/create/details?step=1`);
  }

  redirect(
    `/create/preview?slug=${encodeURIComponent(slug)}&mt=${encodeURIComponent(
      manageToken
    )}&gif_key=${encodeURIComponent(gif_key ?? "")}`
  );
}

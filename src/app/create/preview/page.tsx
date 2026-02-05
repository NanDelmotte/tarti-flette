// src/app/create/preview/page.tsx
import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PreviewClient from "./preview-client";

export default async function CreatePreviewPage({
  searchParams,
}: {
  searchParams: { slug?: string; mt?: string; gif_key?: string };
}) {
  const slug = searchParams.slug || "";
  const mt = searchParams.mt || "";
  const gifFromUrl = (searchParams.gif_key || "").trim() || null;

  if (!slug || !mt) {
    redirect("/create");
  }

  const supabase = createSupabaseServer();
  const { data: ev } = await supabase.rpc("get_event_by_slug", { p_slug: slug });
  const e: any = ev?.[0] || null;

  if (!e) {
    return (
      <main style={{ maxWidth: 620, margin: "30px auto", padding: 16 }}>
        <h1>Not found</h1>
      </main>
    );
  }

  const gifKey = (typeof e.gif_key === "string" ? e.gif_key.trim() : "") || gifFromUrl;

  return (
    <PreviewClient
      slug={slug}
      mt={mt}
      event={{
        title: e.title,
        description: e.description,
        starts_at: e.starts_at,
        ends_at: e.ends_at,
        location: e.location,
        gif_key: gifKey,
      }}
      markSharedAction={markSharedAction}
    />
  );
}

async function markSharedAction(formData: FormData) {
  "use server";
  const mt = String(formData.get("mt") || "");
  const slug = String(formData.get("slug") || "");
  if (!mt || !slug) return;

  const supabase = createSupabaseServer();

  const res: any = await supabase.rpc("mark_first_shared", {
    p_manage_token: mt,
  });
  if (res?.error) {
    // noop
  }

  redirect(`/e/${slug}`);
}

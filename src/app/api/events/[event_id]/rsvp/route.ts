// src/app/api/events/[event_id]/rsvp/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const {
    event_instance_id,
    status,
    first_name,
    last_name,
    comment,
  } = await request.json();

  if (!event_instance_id || !status || !first_name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const normalizedComment =
    typeof comment === "string" && comment.trim()
      ? comment.trim()
      : null;

  const cookieStore = cookies();
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileId = user?.id ?? null;

  // 1️⃣ Look for existing RSVP
  let existingQuery = supabase
    .from("rsvps")
    .select("id")
    .eq("event_instance_id", event_instance_id)
    .limit(1);

  if (profileId) {
    existingQuery = existingQuery.eq("profile_id", profileId);
  } else {
    existingQuery = existingQuery
      .is("profile_id", null)
      .eq("first_name", String(first_name).trim())
      .eq("last_name", String(last_name || "").trim());
  }

  const { data: existing } = await existingQuery.maybeSingle();

  // 2️⃣ Update or insert
  if (existing?.id) {
    const { error } = await supabase
      .from("rsvps")
      .update({
        status,
        comment: normalizedComment,
        responded_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("rsvps").insert({
      event_instance_id,
      status,
      first_name: String(first_name).trim(),
      last_name: String(last_name || "").trim(),
      profile_id: profileId,
      comment: normalizedComment,
      responded_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return response;
}

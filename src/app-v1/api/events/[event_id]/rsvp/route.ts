// src/app/api/events/[event_id]/rsvp/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const { event_instance_id, status, comment } = await request.json();

  if (!event_instance_id || !status) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const normalizedComment =
    typeof comment === "string" && comment.trim() ? comment.trim() : null;

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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const profileId = user.id;

  // 1) Fetch organizer
  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", params.event_id)
    .single();

  if (!event?.organizer_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // 2) Look for existing RSVP for this logged-in profile + instance
  const { data: existing } = await supabase
    .from("rsvps")
    .select("id, status, first_name, last_name")
    .eq("event_instance_id", event_instance_id)
    .eq("profile_id", profileId)
    .limit(1)
    .maybeSingle();

  const isNew = !existing;
  const statusChanged = existing && existing.status !== status;

  // 3) Update or insert RSVP (no anonymous rows)
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
    // We don't accept names from the client anymore.
    // Store blanks if your schema requires these fields.
    const { error } = await supabase.from("rsvps").insert({
      event_instance_id,
      status,
      profile_id: profileId,
      first_name: "",
      last_name: "",
      comment: normalizedComment,
      responded_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // 4) Enqueue notification
  if (isNew || statusChanged) {
    await supabase.from("notifications_outbox").insert({
      type: "rsvp_changed",
      recipient_profile_id: event.organizer_id,
      event_id: params.event_id,
      payload: {
        event_instance_id,
        status,
        // If you later want proper names, derive them server-side from profile table.
        first_name: existing?.first_name ?? "",
        last_name: existing?.last_name ?? "",
        is_new: isNew,
      },
    });
  }

  return response;
}

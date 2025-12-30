// src/app/api/events/[event_id]/update/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const {
    title,
    visibility,
    dates,
    location,
    description,
  } = await request.json();

  if (!title || !dates || dates.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", params.event_id)
    .single();

  if (!event || event.organizer_id !== user.id) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const { error: eventError } = await supabase
    .from("events")
    .update({
      title,
      visibility,
      description,
    })
    .eq("id", params.event_id);

  if (eventError) {
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }

  await supabase
    .from("event_instances")
    .delete()
    .eq("event_id", params.event_id);

  const instanceRows = dates.map((d: string) => ({
    event_id: params.event_id,
    datetime: d,
    location: location || null,
  }));

  const { error: instanceError } = await supabase
    .from("event_instances")
    .insert(instanceRows);

  if (instanceError) {
    return NextResponse.json(
      { error: "Failed to update dates" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// src/app/api/chats/mine/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1) Events I organize
  const { data: organized } = await supabase
    .from("events")
    .select("id, title")
    .eq("organizer_id", user.id);

  // 2) Events I RSVP’d to
  const { data: rsvped } = await supabase
    .from("rsvps")
    .select(
      `
      event_instances (
        event_id,
        events (
          id,
          title
        )
      )
    `
    )
    .eq("profile_id", user.id);

  const map = new Map<string, { id: string; title: string }>();

  organized?.forEach((e) => {
    map.set(e.id, { id: e.id, title: e.title });
  });

  rsvped?.forEach((row: any) => {
    const event = row.event_instances?.events;
    if (event) {
      map.set(event.id, { id: event.id, title: event.title });
    }
  });

  return NextResponse.json({
    chats: Array.from(map.values()),
  });
}

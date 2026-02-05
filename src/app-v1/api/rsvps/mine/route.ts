// src/app/api/rsvps/mine/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ events: [] });
  }

  // Fetch RSVPs for this user
  const { data, error } = await supabase
    .from("rsvps")
    .select(`
      status,
      event_instance_id,
      event_instances (
        datetime,
        events (
          id,
          title
        )
      )
    `)
    .eq("profile_id", user.id)
    .order("responded_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Could not load RSVPs" },
      { status: 500 }
    );
  }

  const seen = new Set<string>();
  const events: {
    event_id: string;
    title: string;
    next_datetime: string | null;
    status: "yes" | "maybe" | "no";
  }[] = [];

  for (const row of (data || []) as any[]) {
    const instance = Array.isArray(row.event_instances)
      ? row.event_instances[0]
      : row.event_instances;

    const event = instance?.events;
    if (!event || seen.has(event.id)) continue;

    seen.add(event.id);

    events.push({
      event_id: event.id,
      title: event.title,
      next_datetime: instance?.datetime || null,
      status: row.status,
    });
  }

  return NextResponse.json({ events });
}

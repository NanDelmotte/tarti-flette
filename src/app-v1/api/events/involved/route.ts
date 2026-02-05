// src/app/api/events/involved/route.ts

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
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1) Events I organize
  const { data: organized, error: organizedError } = await supabase
    .from("events")
    .select("id, title, organizer_id, event_instances ( id, datetime )")
    .eq("organizer_id", user.id);

  if (organizedError) {
    return NextResponse.json(
      { error: organizedError.message },
      { status: 500 }
    );
  }

  // 2) Events I RSVP’d to
  const { data: rsvped, error: rsvpedError } = await supabase
    .from("rsvps")
    .select(`
  event_instances (
    id,
    datetime,
    event_id,
    events (
      id,
      title,
      organizer_id,
      event_instances ( id )
    )
  )
    `
    )
    .eq("profile_id", user.id);

  if (rsvpedError) {
    return NextResponse.json(
      { error: rsvpedError.message },
      { status: 500 }
    );
  }

  const now = new Date();

  const organizedEvents =
    organized?.map((event: any) => {
      const futureInstances =
        event.event_instances
          ?.map((i: any) => ({ id: i.id, date: new Date(i.datetime) }))
          .filter((i: any) => i.date > now)
          .sort((a: any, b: any) => a.date.getTime() - b.date.getTime()) ?? [];

      return {
        id: event.id,
        title: event.title,
        datetime: futureInstances[0]?.date ?? null,
        instance_ids: event.event_instances?.map((i: any) => i.id) ?? [],
        host: "me" as const,
        organizer_id: event.organizer_id,
        organizer_name: null as string | null,
      };
    }) ?? [];

  const rsvpedEvents =
    rsvped?.map((row: any) => {
      const event = row.event_instances?.events;
      if (!event) return null;

      return {
        id: event.id,
        title: event.title,
        datetime: row.event_instances.datetime
          ? new Date(row.event_instances.datetime)
          : null,
        instance_ids: event.event_instances?.map((i: any) => i.id) ?? [],
        host:
          event.organizer_id === user.id ? "me" : "other",
        organizer_id: event.organizer_id,
        organizer_name: null as string | null,
      };
    }) ?? [];

  const allRaw = [...organizedEvents, ...rsvpedEvents].filter(
    (e): e is NonNullable<typeof e> => e !== null
  );

  // Collect ALL instance IDs
  const instanceIds = Array.from(
    new Set(allRaw.flatMap((e) => e.instance_ids))
  );

  // 3) RSVP counts via event_instances
  const rsvpCountMap = new Map<string, number>();

  if (instanceIds.length > 0) {
    const { data: rsvps } = await supabase
      .from("rsvps")
      .select("event_instance_id")
      .in("event_instance_id", instanceIds);

    (rsvps || []).forEach((r: any) => {
      const instanceId = r.event_instance_id;
      const event = allRaw.find((e) =>
        e.instance_ids.includes(instanceId)
      );
      if (!event) return;

      rsvpCountMap.set(
        event.id,
        (rsvpCountMap.get(event.id) ?? 0) + 1
      );
    });
  }

  // 4) Organizer names
  const organizerIds = Array.from(
    new Set(allRaw.map((e) => e.organizer_id))
  );

  const nameMap = new Map<string, string>();

  if (organizerIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, first_name")
      .in("id", organizerIds);

    (profs || []).forEach((p: any) => {
      if (p?.id && p?.first_name) {
        nameMap.set(p.id, p.first_name);
      }
    });
  }

  const all = allRaw
    .map((e) => ({
      id: e.id,
      title: e.title,
      datetime: e.datetime,
      host: e.host,
      organizer_name: nameMap.get(e.organizer_id) ?? null,
      rsvp_count: rsvpCountMap.get(e.id) ?? 0,
    }))
    
   .sort(
  (a, b) =>
    (a.datetime ? a.datetime.getTime() : 0) -
    (b.datetime ? b.datetime.getTime() : 0)
);


  return NextResponse.json({ events: all });
}

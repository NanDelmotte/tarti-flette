// src/app/api/events/mine/route.ts

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

  // Profile name
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name
    ? profile.first_name.charAt(0).toUpperCase() +
      profile.first_name.slice(1)
    : null;

  // Events organized by user
  const { data: events } = await supabase
    .from("events")
    .select("id, title, created_at")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  const eventIds = events?.map((e) => e.id) ?? [];

  // Instances
  const { data: instances } = await supabase
    .from("event_instances")
    .select("id, event_id, datetime")
    .in("event_id", eventIds);

  const instanceIds = instances?.map((i) => i.id) ?? [];

  // RSVPs (anon + profile)
  const { data: rsvps } = instanceIds.length
    ? await supabase
        .from("rsvps")
        .select(`
          event_instance_id,
          profile_id,
          first_name,
          last_name,
          event_instances ( event_id )
        `)
        .in("event_instance_id", instanceIds)
    : { data: [] };

  const now = new Date();

  const shapedEvents =
    events?.map((event) => {
      const eventInstances =
        instances?.filter((i) => i.event_id === event.id) ?? [];

      const upcoming = eventInstances.filter(
        (i) => new Date(i.datetime) > now
      );

      const nextInstance =
        upcoming.sort(
          (a, b) =>
            new Date(a.datetime).getTime() -
            new Date(b.datetime).getTime()
        )[0] ?? null;

      const rsvpCount =
        (rsvps ?? []).filter(
          (r: any) =>
            r.event_instances?.event_id === event.id
        ).length;

      return {
        id: event.id,
        title: event.title,
        created_at: event.created_at,
        totalInstances: eventInstances.length,
        upcomingCount: upcoming.length,
        nextInstanceDate: nextInstance ? nextInstance.datetime : null,
        uniqueRsvpCount: rsvpCount,
      };
    }) ?? [];

  const hasRsvps =
    (rsvps ?? []).some((r: any) => r.profile_id === user.id);

  return NextResponse.json({
    firstName,
    events: shapedEvents,
    hasRsvps,
  });
}

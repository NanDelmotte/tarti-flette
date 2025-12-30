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

  // 1) Events I organize (KEEP working query)
  const { data: organized, error: organizedError } = await supabase
    .from("events")
    .select("id, title, organizer_id, event_instances ( datetime )")
    .eq("organizer_id", user.id);

  if (organizedError) {
    return NextResponse.json(
      { error: organizedError.message },
      { status: 500 }
    );
  }

  // 2) Events I RSVP’d to (KEEP working query)
  const { data: rsvped, error: rsvpedError } = await supabase
    .from("rsvps")
    .select(
      `
      event_instances (
        datetime,
        event_id,
        events (
          id,
          title,
          organizer_id
        )
      )
    `
    )
    .eq("profile_id", user.id);

  if (rsvpedError) {
    return NextResponse.json({ error: rsvpedError.message }, { status: 500 });
  }

  const now = new Date();

  const organizedEvents =
    organized?.map((event: any) => {
      const futureInstances =
        event.event_instances
          ?.map((i: any) => new Date(i.datetime))
          .filter((d: Date) => d > now)
          .sort((a: Date, b: Date) => a.getTime() - b.getTime()) ?? [];

      return {
        id: event.id,
        title: event.title,
        datetime: futureInstances[0] ?? null,
        host: "me" as const,
        organizer_id: event.organizer_id as string,
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
        host: event.organizer_id === user.id ? ("me" as const) : ("other" as const),
        organizer_id: event.organizer_id as string,
        organizer_name: null as string | null,
      };
    }) ?? [];

  type EventRow = {
    id: string;
    title: string;
    datetime: Date | null;
    host: "me" | "other";
    organizer_id: string;
    organizer_name: string | null;
  };

  const allRaw = [...organizedEvents, ...rsvpedEvents].filter(
    (e): e is EventRow => !!e
  );

  // Collect organizer ids we need names for (mostly "other", but safe to do all)
  const organizerIds = Array.from(
    new Set(allRaw.map((e) => e.organizer_id).filter(Boolean))
  );

  // Lookup names in profiles in a separate query (avoids nested-select shape issues)
  let nameMap = new Map<string, string>();
  if (organizerIds.length > 0) {
    const { data: profs, error: profError } = await supabase
      .from("profiles")
      .select("id, first_name")
      .in("id", organizerIds);

    if (profError) {
      return NextResponse.json({ error: profError.message }, { status: 500 });
    }

    (profs || []).forEach((p: any) => {
      if (p?.id && p?.first_name) nameMap.set(p.id, p.first_name);
    });
  }

  // Attach organizer_name
  const allWithNames = allRaw.map((e) => ({
    ...e,
    organizer_name: nameMap.get(e.organizer_id) ?? null,
  }));

  // Keep your existing “must have a Date” behavior
  const all = allWithNames
    .filter((e) => e.datetime instanceof Date && !isNaN(e.datetime.getTime()))
    .sort((a, b) => (a.datetime as Date).getTime() - (b.datetime as Date).getTime());

  return NextResponse.json({ events: all });
}

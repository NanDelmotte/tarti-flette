// src/app/api/events/[event_id]/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(
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

  // 1️⃣ Event + instances (authoritative)
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      visibility,
      organizer_id,
      event_instances (
        id,
        datetime,
        location
      )
    `)
    .eq("id", params.event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Event not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Organizer
  const { data: organizer } = await supabase
    .from("profiles")
    .select("id, first_name")
    .eq("id", event.organizer_id)
    .maybeSingle();

  // 3️⃣ RSVPs
  const instanceIds = event.event_instances.map(
    (i: any) => i.id
  );

  const { data: rsvpRows } = instanceIds.length
    ? await supabase
        .from("rsvps")
        .select(
          "event_instance_id, status, first_name, last_name"
        )
        .in("event_instance_id", instanceIds)
    : { data: [] };

  const rsvps: Record<
    string,
    { yes: string[]; maybe: string[]; no: string[] }
  > = {};

  for (const id of instanceIds) {
    rsvps[id] = { yes: [], maybe: [], no: [] };
  }

  for (const row of rsvpRows || []) {
    const bucket = rsvps[row.event_instance_id];
    if (!bucket) continue;

    const name = `${row.first_name} ${row.last_name ?? ""}`.trim();

    if (row.status === "yes") bucket.yes.push(name);
    else if (row.status === "maybe") bucket.maybe.push(name);
    else if (row.status === "no") bucket.no.push(name);
  }

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      visibility: event.visibility,
      organizer: {
        id: organizer?.id,
        first_name:
          organizer?.first_name ?? "The organizer",
      },
      instances: event.event_instances,
    },
    rsvps,
  });
}

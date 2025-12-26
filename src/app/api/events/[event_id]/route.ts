// src/app/api/events/[event_id]/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  // 1️⃣ Fetch event + instances
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
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
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // 2️⃣ Organizer (optional)
  const { data: organizer } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", event.organizer_id)
    .maybeSingle();

  // 3️⃣ Fetch RSVPs (by instance ids)
  const instanceIds = (event.event_instances || []).map((i: any) => i.id);

  const { data: rsvpRows } = await supabase
    .from("rsvps")
    .select(`event_instance_id, status, first_name, last_name`)
    .in("event_instance_id", instanceIds);

  // 4️⃣ Init buckets
  const rsvps: Record<string, { yes: string[]; maybe: string[]; no: string[] }> =
    {};

  for (const id of instanceIds) {
    rsvps[id] = { yes: [], maybe: [], no: [] };
  }

  // 5️⃣ Fill buckets
  for (const row of rsvpRows || []) {
    const bucket = rsvps[row.event_instance_id];
    if (!bucket) continue;

    const status = String(row.status || "").toLowerCase();
    const name = `${row.first_name} ${row.last_name}`;

    if (status === "yes") bucket.yes.push(name);
    else if (status === "maybe") bucket.maybe.push(name);
    else if (status === "no") bucket.no.push(name);
  }

  // 6️⃣ Return response
  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      organizer: {
        first_name: organizer?.first_name ?? "The organizer",
      },
      instances: event.event_instances || [],
    },
    rsvps,
  });
}

// src/app/api/events/[event_id]/dashboard/route.ts

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

  // 1️⃣ Event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,title,description,created_at")
    .eq("id", params.event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // 2️⃣ Instances
  const { data: instances, error: instError } = await supabase
    .from("event_instances")
    .select("id,datetime,location")
    .eq("event_id", params.event_id)
    .order("datetime", { ascending: true });

  if (instError) {
    return NextResponse.json(
      { error: "Could not load instances" },
      { status: 500 }
    );
  }

  const instanceIds = (instances ?? []).map((i) => i.id);

  // 3️⃣ RSVPs (anon + profile)
  const { data: rsvps, error: rsvpError } = instanceIds.length
    ? await supabase
        .from("rsvps")
        .select(`
          event_instance_id,
          status,
          first_name,
          last_name,
          profile_id,
          profiles (
            first_name
          )
        `)
        .in("event_instance_id", instanceIds)
    : { data: [], error: null };

  if (rsvpError) {
    return NextResponse.json(
      { error: "Could not load RSVPs" },
      { status: 500 }
    );
  }

  // 4️⃣ Shape RSVPs by instance (explicit name resolution)
  const rsvpsByInstance: Record<
    string,
    { status: string; name: string }[]
  > = {};

  (instances ?? []).forEach((i) => {
    rsvpsByInstance[i.id] = [];
  });

  (rsvps ?? []).forEach((r: any) => {
    let name = "Guest";

    if (r.profile_id && r.profiles?.first_name) {
      name = r.profiles.first_name;
    } else if (r.first_name) {
      name = `${r.first_name}${r.last_name ? " " + r.last_name : ""}`;
    }

    rsvpsByInstance[r.event_instance_id]?.push({
      status: r.status,
      name,
    });
  });

  return NextResponse.json({
    event,
    instances,
    rsvpsByInstance,
  });
}

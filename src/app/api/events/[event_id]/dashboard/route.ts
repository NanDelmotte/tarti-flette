import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id,title,description,created_at")
    .eq("id", params.event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Instances
  const { data: instances, error: instError } = await supabase
    .from("event_instances")
    .select("id,datetime,location")
    .eq("event_id", params.event_id)
    .order("datetime", { ascending: true });

  if (instError) {
    return NextResponse.json({ error: "Could not load instances" }, { status: 500 });
  }

  // RSVPs per instance
  const { data: rsvps, error: rsvpError } = await supabase
    .from("rsvps")
    .select("id,event_instance_id,status,guest_id")
    .in(
      "event_instance_id",
      (instances ?? []).map((i: any) => i.id)
    );

  if (rsvpError) {
    return NextResponse.json({ error: "Could not load RSVPs" }, { status: 500 });
  }

  // Guests
  const guestIds = Array.from(new Set((rsvps ?? []).map((r: any) => r.guest_id)));
  const { data: guests } = await supabase
    .from("guests")
    .select("id,name,phone")
    .in("id", guestIds);

  // Shape RSVPs by instance
  const byInstance: Record<string, any[]> = {};
  (instances ?? []).forEach((i: any) => (byInstance[i.id] = []));

  (rsvps ?? []).forEach((r: any) => {
    const g = (guests ?? []).find((x: any) => x.id === r.guest_id);
    byInstance[r.event_instance_id]?.push({
      status: r.status,
      guest: g ? { id: g.id, name: g.name, phone: g.phone } : null,
    });
  });

  // Interest signals (count only)
  const { count: interestCount } = await supabase
    .from("interest_signals")
    .select("*", { count: "exact", head: true })
    .eq("event_id", params.event_id);

  return NextResponse.json({
    event,
    instances,
    rsvpsByInstance: byInstance,
    interestCount: interestCount ?? 0,
  });
}

import { NextResponse } from "next/server"; import { createClient } from "@supabase/supabase-js";

export async function GET(
request: Request,
{ params }: { params: { event_id: string } }
) {
const { event_id } = params;

const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch event
const { data: event, error: eventError } = await supabase
.from("events")
.select("*")
.eq("id", event_id)
.single();

if (eventError || !event) {
return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

// Fetch instances
const { data: instances, error: instError } = await supabase
.from("event_instances")
.select("*")
.eq("event_id", event_id)
.order("datetime", { ascending: true });

if (instError) {
return NextResponse.json({ error: "Could not load instances" }, { status: 500 });
}

return NextResponse.json({
event,
instances: instances ?? []
});
}
import { NextResponse } from "next/server"; import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
try {
const authHeader = request.headers.get("authorization");
if (!authHeader) {
return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
}

const token = authHeader.replace("Bearer ", "").trim();

// Supabase client WITH user's access token
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { headers: { Authorization: `Bearer ${token}` } } }
);

// Verify auth
const { data: userData, error: userError } = await supabase.auth.getUser();
if (userError || !userData?.user) {
  return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
}

const organizer_id = userData.user.id;

// Parse body
const body = await request.json();
const { title, description, location, visibility, isSeries, dates } = body;

if (!title || !dates || dates.length === 0) {
  return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
}

// 1️⃣ Create event
const { data: eventData, error: eventError } = await supabase
  .from("events")
  .insert({
    organizer_id,
    title,
    description,
    visibility,
    is_series: isSeries
  })
  .select("id")
  .single();

if (eventError) {
  console.error("Event insert error:", eventError);
  return NextResponse.json({ error: "Could not create event" }, { status: 500 });
}

const event_id = eventData.id;

// 2️⃣ Create event instances
const instanceRows = dates.map((d: string) => ({
  event_id,
  datetime: d,
  location,
}));

const { error: instanceError } = await supabase
  .from("event_instances")
  .insert(instanceRows);

if (instanceError) {
  console.error("Instance insert error:", instanceError);
  return NextResponse.json({ error: "Could not create event instances" }, { status: 500 });
}

return NextResponse.json({ event_id });


} catch (err) {
console.error(err);
return NextResponse.json({ error: "Server error" }, { status: 500 });
}
}
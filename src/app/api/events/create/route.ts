// app/api/events/create/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
const cookieStore = cookies();

const supabase = createServerClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
{
cookies: {
get(name) {
return cookieStore.get(name)?.value;
},
set(name, value, options) {
cookieStore.set({ name, value, ...options });
},
remove(name, options) {
cookieStore.set({ name, value: "", ...options });
},
},
}
);

const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
return NextResponse.json(
{ error: "You must be logged in" },
{ status: 401 }
);
}

const body = await request.json();
const {
first_name,
last_name,
title,
description,
location,
visibility,
isSeries,
dates,
} = body;

if (!title || !dates || dates.length === 0) {
  return NextResponse.json(
    { error: "Missing required fields" },
    { status: 400 }
);
}

// 1️⃣ Ensure profile exists (authoritative place)
const { error: profileError } = await supabase .from("profiles") .upsert({ id: user.id, phone: user.phone, first_name: String(first_name).trim(), last_name: String(last_name).trim(), });

if (profileError) {
console.error(profileError);
return NextResponse.json(
{ error: "Could not save profile" },
{ status: 500 }
);
}

// 2️⃣ Create event
const { data: event, error: eventError } = await supabase
.from("events")
.insert({
organizer_id: user.id,
title,
description,
visibility,
is_series: isSeries,
})
.select("id")
.single();

if (eventError) {
console.error(eventError);
return NextResponse.json(
{ error: "Could not create event" },
{ status: 500 }
);
}

// 3️⃣ Create instances
const instanceRows = dates.map((d: string) => ({
event_id: event.id,
datetime: d,
location,
}));

const { error: instanceError } = await supabase
.from("event_instances")
.insert(instanceRows);

if (instanceError) {
console.error(instanceError);
return NextResponse.json(
{ error: "Could not create event instances" },
{ status: 500 }
);
}

return NextResponse.json({ event_id: event.id });
}
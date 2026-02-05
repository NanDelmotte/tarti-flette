// src/app/api/events/create/route.ts
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "You must be logged in" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const {
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

  // 1️⃣ CREATE EVENT
  const {
    data: event,
    error: eventError,
  } = await supabase
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

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Could not create event" },
      { status: 500 }
    );
  }

  // 2️⃣ CREATE INSTANCES
  const instanceRows = dates.map((d: string) => ({
    event_id: event.id,
    datetime: d,
    location,
  }));

  const { error: instanceError } = await supabase
    .from("event_instances")
    .insert(instanceRows);

  if (instanceError) {
    return NextResponse.json(
      { error: "Could not create event instances" },
      { status: 500 }
    );
  }

  return NextResponse.json({ event_id: event.id });
}

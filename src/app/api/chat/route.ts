// src/app/api/chat/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const event_id = searchParams.get("event_id");

  if (!event_id) {
    return NextResponse.json(
      { error: "event_id is required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookies().get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );

  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", event_id)
    .single();

  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      profile_id,
      author_name,
      message,
      created_at
    `)
    .eq("event_id", event_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    event_title: event?.title ?? "Event",
    messages: data,
  });
}

export async function POST(request: Request) {
  const { event_id, message } = await request.json();

  if (!event_id || !message) {
    return NextResponse.json(
      { error: "event_id and message are required" },
      { status: 400 }
    );
  }

  const cookieStore = cookies();
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Fetch author name
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const author_name = profile?.first_name ?? "Unknown";

  // Insert chat message
  const { error: insertError } = await supabase
    .from("chat_messages")
    .insert({
      event_id,
      profile_id: user.id,
      author_name,
      message,
    });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  // 🔔 Enqueue chat notifications (event-level)

  // 1️⃣ Fetch all instances for this event
  const { data: instances } = await supabase
    .from("event_instances")
    .select("id")
    .eq("event_id", event_id);

  const instanceIds = instances?.map((i) => i.id) ?? [];

  if (instanceIds.length === 0) {
    return response;
  }

  // 2️⃣ Fetch verified RSVPs across all instances (exclude author)
  const { data: recipients } = await supabase
    .from("rsvps")
    .select("profile_id")
    .in("event_instance_id", instanceIds)
    .not("profile_id", "is", null)
    .neq("profile_id", user.id);

  if (recipients?.length) {
    await supabase.from("notifications_outbox").insert(
      recipients.map((r) => ({
        type: "chat_message",
        recipient_profile_id: r.profile_id,
        event_id,
        payload: {
          author_name,
          message,
        },
      }))
    );
  }

  return response;
}

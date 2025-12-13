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

  if (!user || authError) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: events, error } = await supabase
    .from("events")
    .select(
      `
        id,
        title,
        created_at,
        event_instances (
          id,
          datetime
        )
      `
    )
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const now = new Date();

  const shapedEvents = (events || []).map((event) => {
    const instances = event.event_instances || [];

    const upcoming = instances.filter(
      (i) => new Date(i.datetime) > now
    );

    const nextInstance =
      upcoming.sort(
        (a, b) =>
          new Date(a.datetime).getTime() -
          new Date(b.datetime).getTime()
      )[0] || null;

    return {
      id: event.id,
      title: event.title,
      created_at: event.created_at,
      totalInstances: instances.length,
      upcomingCount: upcoming.length,
      nextInstanceDate: nextInstance
        ? nextInstance.datetime
        : null,
    };
  });

  return NextResponse.json({ events: shapedEvents });
}

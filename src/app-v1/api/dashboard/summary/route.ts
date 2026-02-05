import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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

  if (!user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { count: createdEventsCount, error: eventsErr } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("organizer_id", user.id);

  if (eventsErr) {
    return NextResponse.json({ error: eventsErr.message }, { status: 500 });
  }

  const { count: rsvpsCount, error: rsvpsErr } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id);

  if (rsvpsErr) {
    return NextResponse.json({ error: rsvpsErr.message }, { status: 500 });
  }

  return NextResponse.json({
    createdEventsCount: createdEventsCount ?? 0,
    rsvpsCount: rsvpsCount ?? 0,
  });
}

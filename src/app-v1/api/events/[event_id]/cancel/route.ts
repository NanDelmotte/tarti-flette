// src/app/api/events/[event_id]/cancel/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(
  _request: Request,
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", params.event_id)
    .eq("organizer_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Could not cancel event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

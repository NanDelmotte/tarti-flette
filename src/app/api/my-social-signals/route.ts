// src/app/api/my-social-signals/route.ts

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

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("event_interest")
    .select(
      `
      id,
      created_at,
      events (
        title,
        organizer_id
      ),
      profiles (
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load social signals" },
      { status: 500 }
    );
  }

  const signals =
    data
      ?.filter(
        (row: any) =>
          row.events?.organizer_id === user.id
      )
      .map((row: any) => ({
        id: row.id,
        event_title: row.events.title,
        interested_name: `${row.profiles.first_name}${
          row.profiles.last_name
            ? " " + row.profiles.last_name
            : ""
        }`,
        created_at: row.created_at,
      })) ?? [];

  return NextResponse.json({ signals });
}

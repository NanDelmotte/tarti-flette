// src/app/auth/callback/rsvp/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventId = url.searchParams.get("event_id");
  const code = url.searchParams.get("code");

  if (!eventId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(
    new URL(`/cirklie/${eventId}/rsvp/respond`, request.url)
  );

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

  if (!code) {
    return response;
  }

  // 1️⃣ Exchange code for session
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2️⃣ Fetch authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3️⃣ Ensure profile exists (authoritative)
  if (user) {
    const firstName = user.user_metadata?.first_name;
    const lastName = user.user_metadata?.last_name;
    const phone = user.user_metadata?.phone;

    if (firstName && lastName && phone) {
      await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
          { onConflict: "id" }
        );
    }
  }

  return response;
}

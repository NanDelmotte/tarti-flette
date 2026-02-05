// src/app/api/auth/verify-otp/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  const body = await request.json();

  const phone = body.phone?.trim();
  const code = body.code?.trim();
  const first_name = body.first_name?.trim();
  const last_name = body.last_name?.trim();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "Phone and code are required" },
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

  const { error: verifyError } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });

  if (verifyError) {
    return NextResponse.json(
      { error: verifyError.message },
      { status: 400 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Auth failed" },
      { status: 401 }
    );
  }

  // Only upsert profile data if names were provided
  if (first_name || last_name) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        phone,
        first_name: first_name || null,
        last_name: last_name || null,
      },
      { onConflict: "id" }
    );
  }

  return response;
}

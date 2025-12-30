// src/app/api/profile/ensure/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST() {
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = user.email;
  const firstName = user.user_metadata?.first_name;

  if (!email || !firstName) {
    return NextResponse.json(
      { error: "Missing email or first_name on user" },
      { status: 400 }
    );
  }

  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      first_name: String(firstName),
      last_name: null,
      phone: null,
    },
    { onConflict: "id" }
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return response;
}

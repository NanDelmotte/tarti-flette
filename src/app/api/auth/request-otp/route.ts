import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { phone } = await request.json();

  if (!phone) {
    return NextResponse.json(
      { error: "Phone is required" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    shouldCreateUser: true,
  });

  if (error) {
    console.error("OTP Request Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

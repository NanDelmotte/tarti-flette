import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: Request,
  { params }: { params: { organizer_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 bypass RLS
  );

  const { data, error } = await supabase
    .from("events")
    .select("id, title, created_at")
    .eq("organizer_id", params.organizer_id)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error) {
    console.error("by-organizer error", error);
    return NextResponse.json(
      { error: "Failed to load organizer events" },
      { status: 500 }
    );
  }

  return NextResponse.json({ events: data || [] });
}

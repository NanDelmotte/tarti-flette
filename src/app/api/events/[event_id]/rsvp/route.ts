import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  request: Request,
  { params }: { params: { event_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { status, event_instance_id, name, phone } = await request.json();

  if (!status || !event_instance_id) {
    return NextResponse.json(
      { error: "Missing status or event instance" },
      { status: 400 }
    );
  }

  // Step 1 only (no phone yet) → acknowledge
  if (!phone) {
    return NextResponse.json({ ok: true, needsContact: true });
  }

  // Upsert guest by phone + event
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .upsert(
      {
        event_id: params.event_id,
        phone,
        name: name || null,
      },
      { onConflict: "event_id,phone" }
    )
    .select()
    .single();

  if (guestError || !guest) {
    return NextResponse.json(
      { error: "Could not create guest" },
      { status: 500 }
    );
  }

  // Upsert RSVP
  const { error: rsvpError } = await supabase.from("rsvps").upsert(
    {
      event_instance_id,
      guest_id: guest.id,
      status,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "event_instance_id,guest_id" }
  );

  if (rsvpError) {
    return NextResponse.json(
      { error: "Could not save RSVP" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

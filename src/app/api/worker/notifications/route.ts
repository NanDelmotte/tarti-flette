// src/app/api/worker/notifications/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { data: jobs, error } = await supabase
    .from("notifications_outbox")
    .select("id, recipient_profile_id, payload")
    .eq("status", "pending")
    .eq("type", "rsvp_changed")
    .limit(10);
    console.log("WORKER JOB COUNT", jobs?.length);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const job of jobs || []) {
    try {
      // 1️⃣ Fetch email from auth.users
      const { data: user, error: userError } =
        await supabase.auth.admin.getUserById(
          job.recipient_profile_id
        );

      if (userError || !user?.user?.email) {
        throw new Error("Recipient has no email");
      }

      const { first_name, last_name, status } = job.payload;

      // 2️⃣ Send email
      await resend.emails.send({
        from: 'Cirklie <notifications@cirklie.com>',
        to: user.user.email,
        subject: "RSVP update",
        text: `${first_name} ${last_name} responded "${status}" to your event.`,
      });

      // 3️⃣ Mark as processed
      await supabase
        .from("notifications_outbox")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (err: any) {
      await supabase
        .from("notifications_outbox")
        .update({
          status: "failed",
          attempts: 1,
          last_error: err.message,
        })
        .eq("id", job.id);
    }
  }

  return NextResponse.json({ ok: true });
}

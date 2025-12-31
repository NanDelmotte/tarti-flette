// src/app/api/worker/notifications/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { data: jobs, error } = await supabase
    .from("notifications_outbox")
    .select("id, recipient_profile_id, event_id, payload")
    .eq("status", "pending")
    .eq("type", "rsvp_changed")
    .order("created_at", { ascending: true })
    .limit(50);

  console.log("RSVP WORKER JOB COUNT", jobs?.length);

  if (error || !jobs?.length) {
    return NextResponse.json({ ok: true });
  }

  for (const job of jobs) {
    try {
      // 1️⃣ Fetch recipient email
      const { data: user } =
        await supabase.auth.admin.getUserById(
          job.recipient_profile_id
        );

      if (!user?.user?.email) {
        throw new Error("Recipient has no email");
      }

      // 2️⃣ Fetch event title
      const { data: event } = await supabase
        .from("events")
        .select("title")
        .eq("id", job.event_id)
        .single();

      const { first_name, last_name, status } = job.payload;

      const eventTitle = event?.title ?? "your event";
      const eventUrl = `https://tarti-flette.fly.dev/cirklie/${job.event_id}`;

      const body = [
        `Event: ${eventTitle}`,
        "",
        `${first_name} ${last_name} responded "${status}".`,
        "",
        "View the event:",
        eventUrl,
      ].join("\n");

      // 3️⃣ Send email
      await resend.emails.send({
        from: "Beta testers (nancy) <notifications@cirklie.com>",
        to: user.user.email,
        subject: `RSVP update – ${eventTitle}`,
        text: body,
      });

      // 4️⃣ Mark as processed
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

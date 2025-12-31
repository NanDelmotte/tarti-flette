//src/app/api/worker/chat-notifications/route.ts

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
    .select(
      "id, recipient_profile_id, event_id, payload, created_at"
    )
    .eq("status", "pending")
    .eq("type", "chat_message")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !jobs?.length) {
    return NextResponse.json({ ok: true });
  }

  const groups = new Map<
    string,
    {
      recipient_profile_id: string;
      event_id: string;
      jobs: typeof jobs;
    }
  >();

  for (const job of jobs) {
    const key = `${job.recipient_profile_id}:${job.event_id}`;

    if (!groups.has(key)) {
      groups.set(key, {
        recipient_profile_id: job.recipient_profile_id,
        event_id: job.event_id,
        jobs: [],
      });
    }

    groups.get(key)!.jobs.push(job);
  }

  for (const group of groups.values()) {
    try {
      const { data: user } =
        await supabase.auth.admin.getUserById(
          group.recipient_profile_id
        );

      if (!user?.user?.email) {
        throw new Error("Recipient has no email");
      }

      const body = group.jobs
        .map(
          (j) =>
            `${j.payload.author_name}: ${j.payload.message}`
        )
        .join("\n");

      await resend.emails.send({
        from: "Cirklie <notifications@cirklie.com>",
        to: user.user.email,
        subject: "New chat messages",
        text: body,
      });

      await supabase
        .from("notifications_outbox")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .in(
          "id",
          group.jobs.map((j) => j.id)
        );
    } catch (err: any) {
      await supabase
        .from("notifications_outbox")
        .update({
          status: "failed",
          last_error: err.message,
        })
        .in(
          "id",
          group.jobs.map((j) => j.id)
        );
    }
  }

  return NextResponse.json({ ok: true });
}

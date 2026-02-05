// src/app/api/worker/outbox/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { formatEU, formatEURange } from "@/lib/time";


type Job = {
  id: string;
  recipient_email: string;
  template: "event_update" | "event_cancelled" | "host_message";
  payload: any;
  attempts: number;
}

function renderEventCancelled(payload: any) {
  const title = payload?.title || "This event";
  const host = payload?.host_name || "The host";
  const when = payload?.ends_at
  ? formatEURange(payload?.starts_at, payload?.ends_at)
  : formatEU(payload?.starts_at);
  const where = payload?.location || "";
  const detailsUrl = payload?.slug ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/e/${payload.slug}/details` : "";

  const lines = [
    `Unfortunately, this event has been cancelled.`,
    ``,
    `${host} cancelled "${title}".`,
  ];

  if (when) lines.push(`When: ${when}`);
  if (where) lines.push(`Where: ${where}`);
  if (detailsUrl) {
    lines.push(``);
    lines.push(`View details: ${detailsUrl}`);
  }

  return {
    subject: `Update: ${title} is cancelled`,
    text: lines.join("\n"),
  };
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const { data, error } = await supabase.rpc("get_pending_outbox", { p_limit: 50 });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const jobs = (data || []) as Job[];
  if (jobs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      const payload = job.payload || {};

      let subject = payload.subject;
      let text = payload.body || payload.message;

      if (job.template === "event_cancelled") {
        const rendered = renderEventCancelled(payload);
        subject = rendered.subject;
        text = rendered.text;
      } else {
        subject =
          subject ||
          (job.template === "host_message"
            ? "Message from host"
            : "Event update");
        text = text || JSON.stringify(payload, null, 2);
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Cirklie <notifications@cirklie.com>",
        to: job.recipient_email,
        subject,
        text,
      });

      await supabase.rpc("mark_outbox_sent", { p_id: job.id });
      sent++;
    } catch (err: any) {
      await supabase.rpc("mark_outbox_failed", {
        p_id: job.id,
        p_error: err?.message || "send failed",
      });
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}

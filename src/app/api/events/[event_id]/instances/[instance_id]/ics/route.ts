//src/app/api/events/[event_id]/instances/[instance_id]/ics/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsUtc(dt: Date) {
  // YYYYMMDDTHHMMSSZ
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    "T" +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    "Z"
  );
}

function icsEscape(value: string) {
  // RFC5545 basic escaping
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export async function GET(
  _req: Request,
  { params }: { params: { event_id: string; instance_id: string } }
) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data, error } = await supabase
    .from("event_instances")
    .select(
      `
      id,
      datetime,
      location,
      event_id,
      events!inner (
        title
      )
    `
    )
    .eq("id", params.instance_id)
    .eq("event_id", params.event_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const start = new Date(data.datetime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
  const now = new Date();

  const eventsAny = (data as any).events;
const title =
  (Array.isArray(eventsAny) ? eventsAny[0]?.title : eventsAny?.title) ?? "Event";



  const location = data.location ?? "";

  const uid = `${data.id}@cirklie`;
  const dtstamp = toIcsUtc(now);
  const dtstart = toIcsUtc(start);
  const dtend = toIcsUtc(end);

  const host =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "http://localhost:3000";

  const eventUrl = `${host.replace(/\/$/, "")}/cirklie/${params.event_id}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cirklie//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(title)}`,
    location ? `LOCATION:${icsEscape(location)}` : "",
    `URL:${icsEscape(eventUrl)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  const ics = lines.join("\r\n") + "\r\n";

  const safeTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

  const filename = `cirklie-${safeTitle || "event"}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

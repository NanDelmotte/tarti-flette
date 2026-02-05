import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const TIMEZONE = "Europe/Amsterdam";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Local (no Z, no UTC conversion)
function toIcsLocal(dt: Date) {
  return (
    dt.getFullYear() +
    pad2(dt.getMonth() + 1) +
    pad2(dt.getDate()) +
    "T" +
    pad2(dt.getHours()) +
    pad2(dt.getMinutes()) +
    pad2(dt.getSeconds())
  );
}

function icsEscape(value: string) {
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

  const start = new Date((data as any).datetime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const eventsAny = (data as any).events;
  const title =
    (Array.isArray(eventsAny)
      ? eventsAny[0]?.title
      : eventsAny?.title) ?? "Event";

  const location = (data as any).location ?? "";
  const uid = `${(data as any).id}@cirklie`;

  const host =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const eventUrl = `${host.replace(/\/$/, "")}/cirklie/${params.event_id}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cirklie//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",

    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTART;TZID=${TIMEZONE}:${toIcsLocal(start)}`,
    `DTEND;TZID=${TIMEZONE}:${toIcsLocal(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    location ? `LOCATION:${icsEscape(location)}` : "",
    `URL:${icsEscape(eventUrl)}`,
    "END:VEVENT",

    "END:VCALENDAR",
  ];

  const ics = lines.join("\r\n") + "\r\n";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cirklie-event.ics"`,
      "Cache-Control": "no-store",
    },
  });
}

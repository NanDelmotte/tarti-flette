// src/app/e/[slug]/calendar.ics/route.ts

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function formatUtc(dt: Date) {
  return (
    `${dt.getUTCFullYear()}` +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    "T" +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    "Z"
  );
}
function escapeText(s: string) {
  return (s ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}
function buildIcs(args: {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  description?: string | null;
  url: string;
}) {
  const dtstamp = formatUtc(new Date());
  const dtstart = formatUtc(args.startsAt);
  const dtend = args.endsAt ? formatUtc(args.endsAt) : undefined;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cirklie//V2//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(args.uid)}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    ...(dtend ? [`DTEND:${dtend}`] : []),
    `SUMMARY:${escapeText(args.title)}`,
    ...(args.location ? [`LOCATION:${escapeText(args.location)}`] : []),
    ...(args.description ? [`DESCRIPTION:${escapeText(args.description)}`] : []),
    `URL:${escapeText(args.url)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createSupabaseServer();
  const { data } = await supabase.rpc("get_event_by_slug", { p_slug: params.slug });
  const e = data?.[0];

  if (!e) return new NextResponse("Not found", { status: 404 });

  const base = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.example";
  const detailsUrl = `${base}/e/${e.slug}/details`;

  const ics = buildIcs({
    uid: e.id, // stable per event
    title: e.title,
    startsAt: new Date(e.starts_at),
    endsAt: e.ends_at ? new Date(e.ends_at) : null,
    location: e.location,
    description: e.description,
    url: detailsUrl,
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event.ics"`,
      "Cache-Control": "no-store",
    },
  });
}

// src/app/cirklie/[event_id]/rsvp/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../components/Frame";
import { appCopy } from "@/lib/appCopy";

export default function RsvpGatePage({
  params,
}: {
  params: { event_id: string };
}) {
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    fetch("/api/events/" + params.event_id)
      .then((r) => r.json())
      .then((d) => setEvent(d.event));
  }, [params.event_id]);

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  const organizerName = event.organizer?.first_name ?? "The organizer";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <p className="text-sm opacity-70 mb-2">
          <b>{organizerName}</b> invited you to
        </p>

        <h1 className="h1 text-campaign mb-4">{event.title}</h1>

        <div className="space-y-4">
          <p className="text-sm opacity-80">
            There are two ways to RSVP:
            <br />1. Verify your phone to join {appCopy.appName}
            <br />2. One-time Yes / No / Maybe
          </p>

          <button
            className="button-campaign w-full"
            onClick={() => {
              window.location.href = `/cirklie/${params.event_id}/rsvp/login`;
            }}
          >
            Yes, verify my phone
          </button>

          <a
            href={`/cirklie/${params.event_id}/rsvp/respond?mode=anon`}
            className="underline text-sm block text-center"
          >
            No, a simple RSVP is fine
          </a>

          <p className="text-xs opacity-70 mt-4 text-center">
            <strong>Why should I join {appCopy.appName}?</strong>
            <br />
            It is the only way to chat, change RSVP, create links and see who is
            coming!
          </p>
        </div>
      </Frame>
    </main>
  );
}

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
        {/* Context */}
        <p className="text-sm opacity-70 mb-1">
          <b>{organizerName}</b> is hosting
        </p>

        <h1 className="h1 text-campaign mb-3">{event.title}</h1>

        <p className="text-sm opacity-70 mb-6">
          {event.visibility === "inner" && "This is an inner-circle gathering"}
          {event.visibility === "friends" &&
            "Friends and friends of friends are welcome"}
          {event.visibility === "public" &&
            "This event is open — the more the merrier"}
        </p>

        {/* Prompt */}
        <p className="text-sm font-medium mb-4">How would you like to respond?</p>

        {/* Only option */}
        <div className="space-y-2">
          <button
            className="button-campaign w-full"
            onClick={() => {
              window.location.href = `/cirklie/${params.event_id}/rsvp/join`;
            }}
          >
            Login or Sign Up to {appCopy.appName}
          </button>

          <p className="text-xs opacity-70">
            Join {appCopy.appName} to chat, change your response later, and see
            who else is coming
          </p>
        </div>
      </Frame>
    </main>
  );
}

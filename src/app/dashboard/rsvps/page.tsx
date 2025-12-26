// src/app/dashboard/rsvps/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../components/Frame";

type RsvpEvent = {
  event_id: string;
  title: string;
  next_datetime: string | null;
  status: "yes" | "maybe" | "no";
};

export default function DashboardRsvpsPage() {
  const [events, setEvents] = useState<RsvpEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rsvps/mine");
      const data = await res.json();
      setEvents(data.events || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>Loading your RSVPs…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
      <Frame>
        <a href="/dashboard" className="text-xs underline opacity-70">
          ← Back to dashboard
        </a>

        <h1 className="h1 text-campaign mt-2">
          Events you’ve RSVP’d to
        </h1>

        <div className="mt-6 space-y-4">
          {events.length === 0 && (
            <p className="text-sm opacity-70">
              You haven’t RSVP’d to any events yet.
            </p>
          )}

          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-button rounded-xl px-4 py-4 space-y-2"
            >
              <h2 className="font-medium">{event.title}</h2>

              {event.next_datetime && (
                <p className="text-xs opacity-70">
                  Next date:{" "}
                  {new Date(event.next_datetime).toLocaleString()}
                </p>
              )}

              <p className="text-sm font-medium">
                You RSVPd:{" "}
                <span className="uppercase">
                  {event.status}
                </span>
              </p>

              <div className="flex gap-4 text-xs">
                <button
                  className="underline"
                  onClick={() =>
                    (window.location.href =
                      `/cirklie/${event.event_id}`)
                  }
                >
                  Open event
                </button>

                <button
                  className="underline"
                  onClick={() =>
                    (window.location.href =
                      `/cirklie/${event.event_id}/rsvp/respond`)
                  }
                >
                  Change RSVP
                </button>
              </div>
            </div>
          ))}
        </div>
      </Frame>
    </main>
  );
}

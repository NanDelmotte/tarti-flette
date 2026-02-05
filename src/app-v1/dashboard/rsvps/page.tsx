"use client";

import { useEffect, useState } from "react";
import Frame from "../../../components/Frame";

type RsvpEvent = {
  event_id: string;
  title: string;
  next_datetime: string | null;
  status: "yes" | "maybe" | "no";
};

function humanStatus(status: RsvpEvent["status"]) {
  if (status === "yes") return "You’re in";
  if (status === "maybe") return "You might go";
  return "You said no";
}

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
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <a href="/dashboard" className="text-xs underline opacity-70">
          ← Back
        </a>

        <h1 className="h1 text-campaign mt-3">
          Things you might be joining
        </h1>

        <div className="mt-6 space-y-4">
          {events.length === 0 && (
            <p className="text-sm opacity-70">
              Nothing here yet
            </p>
          )}

          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-button rounded-xl px-4 py-4 space-y-1"
            >
              <p className="font-medium">
                {event.title}
              </p>

              {event.next_datetime && (
                <p className="text-xs opacity-70">
                  {new Date(event.next_datetime).toLocaleString()}
                </p>
              )}

              <p className="text-sm opacity-80">
                {humanStatus(event.status)}
              </p>

              <div className="flex gap-4 text-xs mt-2">
                <button
                  className="underline"
                  onClick={() =>
                    (window.location.href =
                      `/cirklie/${event.event_id}`)
                  }
                >
                  View
                </button>

                <button
                  className="underline"
                  onClick={() =>
                    (window.location.href =
                      `/cirklie/${event.event_id}/rsvp/respond`)
                  }
                >
                  Change your mind?
                </button>
              </div>
            </div>
          ))}
        </div>
      </Frame>
    </main>
  );
}

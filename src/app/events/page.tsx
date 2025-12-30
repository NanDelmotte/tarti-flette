"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

type EventRow = {
  id: string;
  title: string;
  datetime: string;
  host: "me" | "other";
  organizer_name?: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      if (!meData?.user) {
        window.location.replace("/login");
        return;
      }

      setFirstName(meData.user.firstName);

      const res = await fetch("/api/events/involved");
      const data = await res.json();

      if (!res.ok) {
        window.location.replace("/login");
        return;
      }

      setEvents(data.events || []);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  function formatDate(value: string) {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={firstName} onLogout={handleLogout} showHome>
        <div className="space-y-4 text-sm">
          {events.length === 0 && (
            <p className="opacity-60 text-xs">
              You’re not connected to any events yet.
            </p>
          )}

          {events.map((event) => (
            <a
              key={`${event.id}-${event.datetime}`}
              href={`/cirklie/${event.id}`}
              className="block"
            >
              <div className="font-medium">{event.title}</div>

              <div className="text-xs opacity-70">
                {formatDate(event.datetime)} ·{" "}
                {event.host === "me"
                  ? "You’re hosting"
                  : `Hosted by ${event.organizer_name ?? "someone"}`}
              </div>
            </a>
          ))}
        </div>
      </Frame>
    </main>
  );
}

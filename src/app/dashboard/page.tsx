"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";

type DashboardEvent = {
  id: string;
  title: string;
  created_at: string;
  totalInstances: number;
  upcomingCount: number;
  nextInstanceDate: string | null;
  uniqueRsvpCount: number;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [hasRsvps, setHasRsvps] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events/mine");

        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await res.json();

        setEvents(data.events || []);
        setHasRsvps(Boolean(data.hasRsvps));
        setFirstName(data.firstName || null);

        setLoading(false);
      } catch {
        window.location.replace("/login");
      }
    }

    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  function formatDateTime(value: string) {
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
      <Frame userName={firstName} onLogout={handleLogout}>
        {/* Top left navigation */}
        <div className="mb-3 text-xs opacity-70 text-left">
          <button
            className="underline"
            onClick={() =>
              (window.location.href = "/dashboard/rsvps")
            }
          >
            {appCopy.noun.plural} you might be joining
          </button>
        </div>

        {/* Create action */}
        <div className="text-center mb-6">
          <button
            className="underline text-sm"
            onClick={() =>
              (window.location.href = "/create")
            }
          >
            + Invite people to a new {appCopy.noun.singular}
          </button>
        </div>

        {/* Corkboard notes */}
        <div className="space-y-4">
          {events.map((event) => {
            const formattedDate =
              event.nextInstanceDate &&
              formatDateTime(event.nextInstanceDate);

            return (
              <div
                key={event.id}
                className="bg-button rounded-xl px-4 py-4 space-y-1"
              >
                <p className="font-medium">
                  {event.title}
                </p>

                {formattedDate && (
                  <p className="text-xs opacity-70">
                    {formattedDate}
                  </p>
                )}

                <p className="text-sm opacity-80">
                  {event.uniqueRsvpCount}{" "}
                  {event.uniqueRsvpCount === 1
                    ? "person has replied"
                    : "people have replied"}
                </p>

                <div className="flex gap-4 text-xs mt-2">
                  <button
                    className="underline"
                    onClick={() =>
                      (window.location.href = `/cirklie/${event.id}`)
                    }
                  >
                    Open
                  </button>
                  <button
                    className="underline"
                    onClick={() =>
                      (window.location.href = `/cirklie/${event.id}/share`)
                    }
                  >
                    Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Frame>
    </main>
  );
}

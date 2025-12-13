"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

type DashboardEvent = {
  id: string;
  title: string;
  created_at: string;
  totalInstances: number;
  upcomingCount: number;
  nextInstanceDate: string | null;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/events/mine");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load events.");
          setLoading(false);
          return;
        }

        setEvents(data.events || []);
        setLoading(false);
      } catch {
        setError("Network error while loading events.");
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>Loading your dashboard…</Frame>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>
          <p className="mb-4">{error}</p>
          <button
            className="underline text-sm"
            onClick={() => (window.location.href = "/login")}
          >
            Go to login
          </button>
        </Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
      <Frame>
        <div className="space-y-1">
          <h1 className="h1 text-campaign">My Cirklies</h1>
          <p className="text-sm opacity-70">
            Events you’ve created
          </p>
        </div>

        <div className="mt-4">
          <button
            className="underline text-sm"
            onClick={() => (window.location.href = "/create")}
          >
            + Create a new Cirklie
          </button>
        </div>

        {events.length === 0 && (
          <div className="mt-8 space-y-3 text-sm opacity-80">
            <p>You don’t have any Cirklies yet.</p>
            <button
              className="underline"
              onClick={() => (window.location.href = "/create")}
            >
              Create your first Cirklie
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {events.map((event) => {
            const nextLabel = event.nextInstanceDate
              ? new Date(event.nextInstanceDate).toLocaleString()
              : "No upcoming dates";

            return (
              <div
                key={event.id}
                className="bg-button rounded-xl px-4 py-4 space-y-2"
              >
                <h2 className="font-medium text-base">
                  {event.title}
                </h2>

                <p className="text-xs opacity-70">
                  {event.totalInstances} dates ·{" "}
                  {event.upcomingCount} upcoming
                </p>

                <p className="text-xs opacity-60">
                  Next: {nextLabel}
                </p>

                <div className="flex gap-4 text-xs pt-2 justify-center">
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

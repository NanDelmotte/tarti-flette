// src/app/dashboard/page.tsx
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

  const isFirstRun = events.length === 0 && !hasRsvps;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        {/* TOP BAR */}
        <div className="flex justify-between items-center mb-3 text-xs opacity-70">
          <button
            className="underline"
            onClick={() => (window.location.href = "/dashboard/rsvps")}
          >
            My RSVPs
          </button>

          <div className="flex gap-3 items-center">
            {firstName && <span>Logged in as {firstName}</span>}
            <button className="underline" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        <h1 className="h1 text-campaign text-center">
          {isFirstRun
            ? "Welcome"
            : firstName
            ? `${firstName}’s ${appCopy.noun.plural}`
            : `My ${appCopy.noun.plural}`}
        </h1>

        {isFirstRun && (
          <p className="text-sm opacity-70 text-center mt-1">
            Let’s create your first {appCopy.noun.singular}.
          </p>
        )}

        <div className="mt-3 text-center">
          <button
            className="underline text-sm"
            onClick={() => (window.location.href = "/create")}
          >
            + Create a new {appCopy.noun.singular}
          </button>
        </div>

        <div className="mt-6 divide-y divide-black/10">
          {events.map((event) => {
            const formattedDate =
              event.nextInstanceDate &&
              formatDateTime(event.nextInstanceDate);

            return (
              <div
                key={event.id}
                className="bg-button rounded-xl px-3 py-4 space-y-2"
              >
                <h2 className="text-center font-medium">
                  {event.title}
                </h2>

                {formattedDate && (
                  <p className="text-xs opacity-70 text-center">
                    {formattedDate}
                  </p>
                )}

                <p className="text-base font-semibold text-center">
                  {event.uniqueRsvpCount}{" "}
                  {event.uniqueRsvpCount === 1
                    ? "person has RSVPd"
                    : "people have RSVPd"}
                </p>

                <div className="flex gap-4 justify-center text-xs">
                  <button
                    className="underline"
                    onClick={() =>
                      (window.location.href = `/dashboard/events/${event.id}`)
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

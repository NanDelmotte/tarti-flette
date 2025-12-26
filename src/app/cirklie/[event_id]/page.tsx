// src/app/cirklie/[event_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../components/Frame";

type RsvpGroup = {
  yes: string[];
  maybe: string[];
  no: string[];
};

export default function EventPage({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<Record<string, RsvpGroup>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();

        if (!res.ok || !data.event) {
          setError("Failed to load event");
          return;
        }

        setEvent(data.event);
        setRsvps(data.rsvps || {});
        setSelectedInstanceId(
          data.event.instances?.[0]?.id || ""
        );
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>
          <a href="/dashboard" className="underline text-xs opacity-70">
            ← Back to dashboard
          </a>
          <p className="mt-4">{error}</p>
        </Frame>
      </main>
    );
  }

  const current: RsvpGroup =
    rsvps[selectedInstanceId] || {
      yes: [],
      maybe: [],
      no: [],
    };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <a href="/dashboard" className="underline text-xs opacity-70">
          ← Back to dashboard
        </a>

        <h1 className="h2 text-campaign mt-4">
          {event.title}
        </h1>

        {event.description && (
          <p className="text-sm opacity-70 mt-1">
            {event.description}
          </p>
        )}

        {/* Date selector */}
        <div className="mt-6 text-center">
          {event.instances.length === 1 ? (
            <div className="opacity-80 text-sm">
              {formatDateTime(event.instances[0].datetime)}
            </div>
          ) : (
            <select
              value={selectedInstanceId}
              onChange={(e) =>
                setSelectedInstanceId(e.target.value)
              }
            >
              {event.instances.map((inst: any) => (
                <option key={inst.id} value={inst.id}>
                  {formatDateTime(inst.datetime)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* RSVP lists */}
        <div className="mt-6 space-y-4 text-sm">
          <div>
            <strong>Yes ({current.yes.length})</strong>
            {current.yes.length > 0 && (
              <ul className="mt-1 opacity-80">
                {current.yes.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>Maybe ({current.maybe.length})</strong>
            {current.maybe.length > 0 && (
              <ul className="mt-1 opacity-80">
                {current.maybe.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>No ({current.no.length})</strong>
            {current.no.length > 0 && (
              <ul className="mt-1 opacity-80">
                {current.no.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Frame>
    </main>
  );
}

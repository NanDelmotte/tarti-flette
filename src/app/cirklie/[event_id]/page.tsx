"use client";

import { useEffect, useState } from "react";
import Frame from "../../../components/Frame";

type EventInstance = {
  id: string;
  datetime: string;
};

type Event = {
  id: string;
  title: string;
  description?: string;
  instances: EventInstance[];
};

export default function EventDashboardPage({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();

        if (!res.ok || !data.event) {
          setEvent(null);
        } else {
          setEvent(data.event);
          setSelectedInstanceId(data.instances?.[0]?.id || null);
        }
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global">
        <Frame>
          <h1 className="h2 text-campaign">Cirklie not found</h1>

          <div className="mt-6">
            <button
              className="button-campaign w-full"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Back to my dashboard
            </button>
          </div>
        </Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global">
      <Frame>
        <h1 className="h2 text-campaign">{event.title}</h1>

        {event.description && (
          <p className="text-sm opacity-70 mt-1">{event.description}</p>
        )}

        {/* Actions */}
        <div className="mt-4">
          <select
            className="text-sm underline bg-transparent"
            onChange={(e) => {
              if (e.target.value === "share") {
                window.location.href = `/cirklie/${event.id}/share`;
              }
              if (e.target.value === "dashboard") {
                window.location.href = "/dashboard";
              }
            }}
          >
            <option>Actions</option>
            <option value="share">Share Cirklie</option>
            <option value="dashboard">Back to dashboard</option>
          </select>
        </div>

        {/* Date */}
        <div className="mt-6 space-y-2">
          <label className="form-section-title">Date</label>
          <select
            value={selectedInstanceId || ""}
            onChange={(e) => setSelectedInstanceId(e.target.value)}
          >
            {event.instances.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {new Date(inst.datetime).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* RSVP placeholder */}
        <div className="mt-6 text-sm opacity-70">
          RSVPs
          <div className="mt-2 opacity-60">No responses yet.</div>
        </div>
      </Frame>
    </main>
  );
}

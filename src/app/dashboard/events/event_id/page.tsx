// src/app/dashboard/events/[event_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../components/Frame";

type RsvpStatus = "yes" | "maybe" | "no";

type RsvpRow = {
  name: string;
  comment: string | null;
};

type RsvpGroup = {
  yes: RsvpRow[];
  maybe: RsvpRow[];
  no: RsvpRow[];
};

type EventInstance = {
  id: string;
  datetime: string;
  location?: string;
};

type EventData = {
  id: string;
  title: string;
  description?: string;
  instances: EventInstance[];
};

export default function OrganizerEventDashboard({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [event, setEvent] = useState<EventData | null>(null);
  const [rsvpsByInstance, setRsvpsByInstance] = useState<
    Record<string, RsvpGroup>
  >({});
  const [selectedInstanceId, setSelectedInstanceId] =
    useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/events/${eventId}/dashboard`
        );

        if (res.status === 401) {
          window.location.replace("/login");
          return;
        }

        const data = await res.json();

        if (!res.ok || !data.event) {
          setError("Event not found");
          return;
        }

        const eventData: EventData = data.event;
        setEvent(eventData);

        const grouped: Record<string, RsvpGroup> = {};

        for (const inst of eventData.instances) {
          grouped[inst.id] = {
            yes: [],
            maybe: [],
            no: [],
          };
        }

        for (const [instanceId, groups] of Object.entries(
          data.rsvpsByInstance || {}
        )) {
          if (!grouped[instanceId]) continue;

          const typed = groups as {
            yes?: { name: string; comment?: string }[];
            maybe?: { name: string; comment?: string }[];
            no?: { name: string; comment?: string }[];
          };

          typed.yes?.forEach((r) => {
            grouped[instanceId].yes.push({
              name: r.name,
              comment: r.comment ?? null,
            });
          });

          typed.maybe?.forEach((r) => {
            grouped[instanceId].maybe.push({
              name: r.name,
              comment: r.comment ?? null,
            });
          });

          typed.no?.forEach((r) => {
            grouped[instanceId].no.push({
              name: r.name,
              comment: r.comment ?? null,
            });
          });
        }

        setRsvpsByInstance(grouped);
        setSelectedInstanceId(eventData.instances[0]?.id || "");
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

  const current =
    rsvpsByInstance[selectedInstanceId] || {
      yes: [],
      maybe: [],
      no: [],
    };

  function renderGroup(
    label: string,
    rows: RsvpRow[]
  ) {
    return (
      <div>
        <strong>
          {label} ({rows.length})
        </strong>

        {rows.length > 0 && (
          <ul className="mt-1 space-y-1 text-sm opacity-80">
            {rows.map((r, i) => (
              <li key={i}>
                <div>{r.name}</div>
                {r.comment && (
                  <div className="text-xs opacity-70 ml-2">
                    “{r.comment}”
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

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
              {event.instances.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {formatDateTime(inst.datetime)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {renderGroup("Yes", current.yes)}
          {renderGroup("Maybe", current.maybe)}
          {renderGroup("No", current.no)}
        </div>
      </Frame>
    </main>
  );
}

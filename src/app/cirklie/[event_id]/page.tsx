// src/app/cirklie/[event_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../components/Frame";

type RsvpGroup = {
  yes: string[];
  maybe: string[];
  no: string[];
};

function formatLocal(value: string) {
  const d = new Date(value); // browser converts UTC → local
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} ${hours}:${minutes}`;
}

export default function EventPage({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [event, setEvent] = useState<any>(null);
  const [rsvps, setRsvps] = useState<Record<string, RsvpGroup>>({});
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");

  const [myRsvp, setMyRsvp] = useState<"yes" | "maybe" | "no" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok || !data.event) {
          setError("Failed to load event");
          return;
        }

        setEvent(data.event);
        setRsvps(data.rsvps || {});

        const firstInstance =
          Object.keys(data.rsvps || {})[0] ||
          data.event.instances?.[0]?.id ||
          "";

        setSelectedInstanceId(firstInstance);
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setUserId(d.user.id);
          setUserName(d.user.firstName);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/rsvps/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;
        const match = d.events.find((e: any) => e.event_id === eventId);
        if (match?.status) setMyRsvp(match.status);
      });
  }, [eventId]);

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
        <Frame showHome>
          <p>{error}</p>
        </Frame>
      </main>
    );
  }

  const current =
    rsvps[selectedInstanceId] || { yes: [], maybe: [], no: [] };

  const selectedInstance =
    event.instances?.find((i: any) => i.id === selectedInstanceId) ||
    event.instances?.[0] ||
    null;

  const isOrganizer =
    userId && event.organizer?.id === userId;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={userName} showHome>
        <div className="flex justify-end gap-4 text-sm">
          {isOrganizer && (
            <a
              href={`/cirklie/${eventId}/edit`}
              className="underline"
            >
              Edit
            </a>
          )}
          <a
            href={`/cirklie/${eventId}/chat`}
            className="underline"
          >
            Chat
          </a>
          <a
            href={`/cirklie/${eventId}/share`}
            className="underline"
          >
            ⋯
          </a>
        </div>

        <div className="mt-4 space-y-2">
          <h1 className="h2 text-campaign">{event.title}</h1>

          <div className="text-sm opacity-80">
            {event.instances.length === 1 ? (
              <div>
                {formatLocal(event.instances[0].datetime)}
                {event.instances[0].location && (
                  <div>{event.instances[0].location}</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedInstanceId}
                  onChange={(e) =>
                    setSelectedInstanceId(e.target.value)
                  }
                >
                  {event.instances.map((inst: any) => (
                    <option key={inst.id} value={inst.id}>
                      {formatLocal(inst.datetime)}
                    </option>
                  ))}
                </select>

                {selectedInstance?.location && (
                  <div>{selectedInstance.location}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {myRsvp && (
          <div className="mt-5 text-center">
            <p className="text-sm">
              You said: <strong>{myRsvp.toUpperCase()}</strong>
            </p>
            <a
              href={`/cirklie/${eventId}/rsvp/respond`}
              className="underline text-sm"
            >
              Change response
            </a>
          </div>
        )}

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <strong>Coming ({current.yes.length})</strong>
            {current.yes.map((n: string, i: number) => (
              <div key={i}>{n}</div>
            ))}
          </div>

          <div>
            <strong>Maybe ({current.maybe.length})</strong>
            {current.maybe.map((n: string, i: number) => (
              <div key={i}>{n}</div>
            ))}
          </div>

          <div>
            <strong>No ({current.no.length})</strong>
            {current.no.map((n: string, i: number) => (
              <div key={i}>{n}</div>
            ))}
          </div>
        </div>
      </Frame>
    </main>
  );
}

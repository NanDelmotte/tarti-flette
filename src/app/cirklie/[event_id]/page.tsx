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

  const [myRsvp, setMyRsvp] = useState<"yes" | "maybe" | "no" | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load event + RSVP lists
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
        setSelectedInstanceId(data.event.instances?.[0]?.id || "");
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  // Load *my* RSVP
  useEffect(() => {
    fetch("/api/rsvps/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;

        const match = d.events.find((e: any) => e.event_id === eventId);
        if (match?.status) setMyRsvp(match.status);
      });
  }, [eventId]);

  function formatDateTime(value: string) {
    const d = new Date(value);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month} ${hours}:${minutes}`;
  }

  function statusWord(status: "yes" | "maybe" | "no") {
    if (status === "yes") return "YES";
    if (status === "maybe") return "MAYBE";
    return "NO";
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
            ← Back
          </a>
          <p className="mt-4">{error}</p>
        </Frame>
      </main>
    );
  }

  const current: RsvpGroup =
    rsvps[selectedInstanceId] || { yes: [], maybe: [], no: [] };

  const selectedInstance =
    event.instances?.find((i: any) => i.id === selectedInstanceId) ||
    event.instances?.[0] ||
    null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <a href="/dashboard" className="underline text-xs opacity-70">
          ← Back
        </a>

        {/* Event block */}
        <div className="mt-4 space-y-2">
          <h1 className="h2 text-campaign">{event.title}</h1>

          {event.description && (
            <p className="text-sm opacity-70">{event.description}</p>
          )}

          <div className="text-sm opacity-80">
            {event.instances?.length === 1 ? (
              <div className="space-y-1">
                <div>{formatDateTime(event.instances[0].datetime)}</div>
                {event.instances[0].location && (
                  <div>{event.instances[0].location}</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(e.target.value)}
                >
                  {event.instances.map((inst: any) => (
                    <option key={inst.id} value={inst.id}>
                      {formatDateTime(inst.datetime)}
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

        {/* Your response */}
        {myRsvp && (
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm font-medium">
              You said:{" "}
              <span className="uppercase">{statusWord(myRsvp)}</span>
            </p>

            <a
              href={`/cirklie/${eventId}/rsvp/respond`}
              className="underline text-sm"
            >
              Changed your mind?
            </a>
          </div>
        )}

        {/* Conversation entry */}
        <div className="mt-6 text-center space-y-1">
          <a
            href={`/cirklie/${eventId}/chat`}
            className="underline text-sm"
          >
            Conversation
          </a>
          <p className="text-xs opacity-70">
            Say something, or see what others are saying
          </p>
        </div>

        {/* People */}
        <div className="mt-6 space-y-4 text-sm">
          <div>
            <strong>Coming ({current.yes.length})</strong>
            {current.yes.length > 0 && (
              <ul className="mt-1 opacity-80">
                {current.yes.map((name: string, i: number) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>Might come ({current.maybe.length})</strong>
            {current.maybe.length > 0 && (
              <ul className="mt-1 opacity-80">
                {current.maybe.map((name: string, i: number) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <strong>Not coming ({current.no.length})</strong>
            {current.no.length > 0 && (
              <ul className="mt-1 opacity-70">
                {current.no.map((name: string, i: number) => (
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

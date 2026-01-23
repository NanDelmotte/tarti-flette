"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../../components/Frame";

type Step = "choose" | "done";
type Response = { instanceId: string; status: "yes" | "maybe" | "no" };

export default function RsvpRespondPage({
  params,
  searchParams,
}: {
  params: { event_id: string };
  searchParams: { mode?: string };
}) {
  // Hard-disable anonymous RSVP mode
  useEffect(() => {
    if (searchParams?.mode === "anon") {
      window.location.replace(`/cirklie/${params.event_id}/rsvp/join`);
    }
  }, [params.event_id, searchParams?.mode]);

  const [event, setEvent] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [step, setStep] = useState<Step>("choose");

  const [me, setMe] = useState<{ first_name: string } | null>(null);
  const [gateReady, setGateReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Social signals
  const [otherEvents, setOtherEvents] = useState<any[]>([]);
  const [interests, setInterests] = useState<Set<string>>(new Set());

  // Gate: must be logged in
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user?.firstName) {
          window.location.replace(`/cirklie/${params.event_id}/rsvp/join`);
          return;
        }
        setMe({ first_name: d.user.firstName });
        setGateReady(true);
      });
  }, [params.event_id]);

  // Load event
  useEffect(() => {
    if (!gateReady) return;

    fetch("/api/events/" + params.event_id)
      .then((r) => r.json())
      .then((d) => {
        setEvent(d.event);
        setInstances(d.event.instances || []);
      });
  }, [params.event_id, gateReady]);

  // Load other events by same organizer (social signals)
  useEffect(() => {
    if (!gateReady || !event?.organizer?.id) return;

    fetch(`/api/events/by-organizer/${event.organizer.id}?limit=4`)
      .then((r) => r.json())
      .then((d) => {
        setOtherEvents((d.events || []).filter((e: any) => e.id !== params.event_id));
      });
  }, [gateReady, event, params.event_id]);

  function setResponse(instanceId: string, status: Response["status"]) {
    setResponses((prev) => [
      ...prev.filter((r) => r.instanceId !== instanceId),
      { instanceId, status },
    ]);
  }

  async function submitAll() {
    if (submitting) return;

    setSubmitting(true);

    for (const r of responses) {
      await fetch(`/api/events/${params.event_id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_instance_id: r.instanceId,
          status: r.status,
          first_name: me?.first_name,
          last_name: null,
        }),
      });
    }

    // Submit social signals
    for (const eventId of interests) {
      await fetch("/api/event-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
    }

    setSubmitting(false);
    setStep("done");
  }

  if (!gateReady || !event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  const organizerName = event.organizer?.first_name ?? "The organizer";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={me?.first_name ?? null}>
        <p className="text-sm opacity-70 mb-2">
          <b>{organizerName}</b> is hosting
        </p>

        <h1 className="h1 text-campaign mb-4">{event.title}</h1>

        {step === "choose" && (
          <div className="space-y-6">
            {instances.map((inst) => {
              const current = responses.find((r) => r.instanceId === inst.id)?.status;

              return (
                <div key={inst.id} className="border-b pb-4">
                  <p className="text-sm font-medium">
                    {new Date(inst.datetime).toLocaleString()}
                  </p>

                  <div className="mt-3 flex gap-2">
                    {(["yes", "maybe", "no"] as const).map((s) => (
                      <button
                        key={s}
                        className="button-campaign w-full"
                        style={{ opacity: current === s ? 1 : 0.6 }}
                        onClick={() => setResponse(inst.id, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Social signals */}
            {otherEvents.length > 0 && (
              <div className="border-t pt-4 content-left">
                <p className="text-sm font-medium mb-2">
                  Interested in other events by {organizerName}?
                </p>

                <div className="checkbox-list mb-10">
                  {otherEvents.map((e) => (
                    <label key={e.id} className="checkbox-row text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={interests.has(e.id)}
                        onChange={(ev) => {
                          setInterests((prev) => {
                            const next = new Set(prev);
                            if (ev.target.checked) next.add(e.id);
                            else next.delete(e.id);
                            return next;
                          });
                        }}
                      />
                      <span>{e.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button className="button-campaign w-full" onClick={submitAll}>
              Continue
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <p className="font-medium">{organizerName} has received your RSVP</p>
            <a href="/dashboard" className="underline text-sm">
              Go to my dashboard
            </a>
          </div>
        )}
      </Frame>
    </main>
  );
}

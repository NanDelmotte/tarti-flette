"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../../components/Frame";

type Step = "choose" | "contact" | "done";
type Response = { instanceId: string; status: "yes" | "maybe" | "no" };

type OrganizerEvent = {
  id: string;
  title: string;
};

export default function RsvpRespondPage({
  params,
  searchParams,
}: {
  params: { event_id: string };
  searchParams: { mode?: string };
}) {
  const [event, setEvent] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [step, setStep] = useState<Step>("choose");

  const [me, setMe] = useState<{ first_name: string } | null>(null);
  const [otherEvents, setOtherEvents] = useState<OrganizerEvent[]>([]);
  const [interestedIn, setInterestedIn] = useState<string[]>([]);

  const [gateReady, setGateReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* Gate */
  useEffect(() => {
    if (searchParams?.mode === "anon") {
      setGateReady(true);
      return;
    }

    fetch("/api/events/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.firstName) {
          setMe({ first_name: d.firstName });
          setGateReady(true);
        } else {
          window.location.replace(`/cirklie/${params.event_id}/rsvp`);
        }
      });
  }, [params.event_id, searchParams]);

  /* Load event */
  useEffect(() => {
    if (!gateReady) return;

    fetch("/api/events/" + params.event_id)
      .then((r) => r.json())
      .then((d) => {
        setEvent(d.event);
        setInstances(d.event.instances || []);
      });
  }, [params.event_id, gateReady]);

  /* Load organizer events */
  useEffect(() => {
    if (!event?.organizer?.id || searchParams?.mode === "anon") return;

    fetch(`/api/events/by-organizer/${event.organizer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;
        setOtherEvents(
          d.events.filter((e: OrganizerEvent) => e.id !== params.event_id)
        );
      });
  }, [event, params.event_id, searchParams]);

  function setResponse(instanceId: string, status: Response["status"]) {
    setResponses((prev) => [
      ...prev.filter((r) => r.instanceId !== instanceId),
      { instanceId, status },
    ]);
  }

  function toggleInterest(id: string) {
    setInterestedIn((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
        }),
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
      <Frame>
        <p className="text-sm opacity-70 mb-2">
          <b>{organizerName}</b> is hosting
        </p>

        <h1 className="h1 text-campaign mb-4">{event.title}</h1>

        {step === "choose" && (
          <div className="space-y-6">
            {instances.map((inst) => {
              const current = responses.find(
                (r) => r.instanceId === inst.id
              )?.status;

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

            <button
              className="button-campaign w-full"
              onClick={submitAll}
            >
              Continue
            </button>

            {/* OTHER EVENTS — HARD LEFT-ALIGNED */}
            {me && otherEvents.length > 0 && (
              <div className="content-left">
  <p className="text-med font-medium">
    {organizerName} also hosts
  </p>

  <p className="text-med opacity-70">
    Interested in any of these? We will let {organizerName} know
  </p>

               <div className="checkbox-list" text-xs opacity-70>
    {otherEvents.map((e) => (
      <>
        <input
          key={e.id + "-box"}
          type="checkbox"
          checked={interestedIn.includes(e.id)}
          onChange={() => toggleInterest(e.id)}
        />
        <span key={e.id + "-label"}>{e.title}</span>
      </>
    ))}
                  
                </div>
              </div>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="text-centerspace-y-4">
            <p className="font-medium">
              {organizerName} has received your RSVP
            </p>

            <a href="/dashboard" className="underline text-sm">
              Go to my dashboard
            </a>
          </div>
        )}
      </Frame>
    </main>
  );
}

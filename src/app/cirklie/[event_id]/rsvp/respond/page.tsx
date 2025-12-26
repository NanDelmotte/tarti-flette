// src/app/cirklie/[event_id]/rsvp/respond/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../../components/Frame";

type Step = "choose" | "contact" | "done";
type Response = { instanceId: string; status: "yes" | "maybe" | "no" };

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
  const [previousRsvp, setPreviousRsvp] = useState<
    "yes" | "maybe" | "no" | null
  >(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [gateReady, setGateReady] = useState(false);

  // 🔒 Gate
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
          window.location.replace(
            `/cirklie/${params.event_id}/rsvp`
          );
        }
      });
  }, [params.event_id, searchParams]);

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

  // Load previous RSVP (verified only)
  useEffect(() => {
    if (!me) return;

    fetch("/api/rsvps/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.events) return;

        const match = d.events.find(
          (e: any) => e.event_id === params.event_id
        );

        if (!match) return;

        setPreviousRsvp(match.status);

        setResponses(
          instances.map((inst: any) => ({
            instanceId: inst.id,
            status: match.status,
          }))
        );
      });
  }, [me, params.event_id, instances]);

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
          first_name: me ? me.first_name : firstName.trim(),
          last_name: me ? undefined : lastName.trim(),
          comment: comment.trim(),
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
  const finalStatus =
    responses.length > 0 ? responses[0].status.toUpperCase() : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <p className="text-sm opacity-70 mb-2">
          <b>{organizerName}</b> invited you to
        </p>

        <h1 className="h1 text-campaign mb-2">{event.title}</h1>

        {previousRsvp && step === "choose" && (
          <p className="text-sm font-medium mb-4 text-center">
            You previously RSVPd:{" "}
            <span className="uppercase">{previousRsvp}</span>
          </p>
        )}

        {/* CHOOSE */}
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

            {/* MESSAGE TO HOST */}
            <textarea
              className="w-full bg-button rounded-md px-3 py-2 text-sm"
              placeholder="Message to the host (optional)"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              className="button-campaign w-full"
              onClick={() =>
                me ? submitAll() : setStep("contact")
              }
            >
              Continue
            </button>
          </div>
        )}

        {/* CONTACT (anon identity only) */}
        {step === "contact" && !me && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAll();
            }}
            className="space-y-3"
          >
            <input
              className="w-full bg-button rounded-md px-3 py-2"
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <input
              className="w-full bg-button rounded-md px-3 py-2"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <button
              type="submit"
              disabled={submitting}
              className="button-campaign w-full"
            >
              Confirm RSVP
            </button>
          </form>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="text-center space-y-4">
            <p className="font-medium">
              {organizerName} has received your RSVP
              {finalStatus && (
                <>
                  {" "}
                  of <span className="uppercase">{finalStatus}</span>
                </>
              )}
            </p>

            {me && (
              <a href="/dashboard" className="underline text-sm">
                Go to my dashboard
              </a>
            )}
          </div>
        )}
      </Frame>
    </main>
  );
}

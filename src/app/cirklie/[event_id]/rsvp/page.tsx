"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../components/Frame";

type Instance = {
  id: string;
  datetime: string;
  location: string | null;
};

export default function PublicEventPage({
  params,
}: {
  params: { event_id: string };
}) {
  const [event, setEvent] = useState<any>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");

  const [status, setStatus] = useState<"yes" | "maybe" | "no" | null>(null);
  const [step, setStep] = useState<"choose" | "contact" | "done">("choose");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // ✅ NEW: prevent double submission
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/events/${params.event_id}`);
      const data = await res.json();

      setEvent(data.event);
      setInstances(data.instances || []);
      if (data.instances?.length) {
        setSelectedInstanceId(data.instances[0].id);
      }
    }
    load();
  }, [params.event_id]);

  async function submitStatus(s: "yes" | "maybe" | "no") {
    if (submitting) return;
    setSubmitting(true);

    setStatus(s);
    await fetch(`/api/events/${params.event_id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: s,
        event_instance_id: selectedInstanceId,
      }),
    });

    setSubmitting(false);
    setStep("contact");
  }

  async function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    await fetch(`/api/events/${params.event_id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        event_instance_id: selectedInstanceId,
        name,
        phone,
      }),
    });

    setSubmitting(false);
    setStep("done");
  }

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
      <Frame>
        <h1 className="h1 text-campaign">{event.title}</h1>
        {event.description && <p className="opacity-80">{event.description}</p>}

        {/* Instance selector */}
        <div className="mt-4">
          <select
            className="w-full bg-button rounded-md px-3 py-2"
            value={selectedInstanceId}
            onChange={(e) => setSelectedInstanceId(e.target.value)}
          >
            {instances.map((i) => (
              <option key={i.id} value={i.id}>
                {new Date(i.datetime).toLocaleString()}
                {i.location ? ` · ${i.location}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Step 1: RSVP */}
        {step === "choose" && (
          <div className="mt-6 space-y-3">
            <button
              className="button-campaign w-full"
              disabled={submitting}
              onClick={() => submitStatus("yes")}
            >
              Yes
            </button>
            <button
              className="button-campaign w-full"
              disabled={submitting}
              onClick={() => submitStatus("maybe")}
            >
              Maybe
            </button>
            <button
              className="button-campaign w-full"
              disabled={submitting}
              onClick={() => submitStatus("no")}
            >
              No
            </button>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === "contact" && (
          <form onSubmit={submitContact} className="mt-6 space-y-3">
            <input
              className="w-full bg-button rounded-md px-3 py-2"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full bg-button rounded-md px-3 py-2"
              placeholder="Your phone number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="button-campaign w-full"
            >
              {submitting ? "Saving…" : "Confirm RSVP"}
            </button>
          </form>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="mt-6 text-center">
            <p className="font-medium">Thanks! Your RSVP is saved 🎉</p>
          </div>
        )}
      </Frame>
    </main>
  );
}

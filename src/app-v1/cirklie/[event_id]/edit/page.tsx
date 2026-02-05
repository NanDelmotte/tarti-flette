// src/app/cirklie/[event_id]/edit/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Frame from "../../../../components/Frame";

type Visibility = "inner" | "friends" | "public";

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso); // UTC → local automatically
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function localToUtcIso(local: string) {
  // local string like "2025-12-30T19:00" interpreted as LOCAL time
  // toISOString() converts to UTC with Z
  return new Date(local).toISOString();
}

export default function EditEventPage({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [dates, setDates] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/events/${eventId}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok || !data.event) {
        setError("Failed to load event");
        setLoading(false);
        return;
      }

      setTitle(data.event.title || "");
      setDescription(data.event.description || "");
      setVisibility(data.event.visibility || "friends");
      setLocation(data.event.instances?.[0]?.location || "");

      setDates(
        (data.event.instances || []).map((i: any) =>
          toDatetimeLocalValue(i.datetime)
        )
      );

      setLoading(false);
    }

    load();
  }, [eventId]);

  function updateDate(index: number, value: string) {
    const copy = [...dates];
    copy[index] = value;
    setDates(copy);
  }

  function addDate() {
    setDates((d) => [...d, ""]);
  }

  function removeDate(index: number) {
    setDates((d) => d.filter((_, i) => i !== index));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/events/${eventId}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        location,
        visibility,
        dates: dates.map(localToUtcIso),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error || "Failed to save");
      setSaving(false);
      return;
    }

    window.location.href = `/cirklie/${eventId}`;
  }

  async function cancelEvent() {
    if (!confirm("Cancel this event?")) return;

    setCancelling(true);

    const res = await fetch(`/api/events/${eventId}/cancel`, {
      method: "POST",
    });

    if (res.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("Failed to cancel event");
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame showHome>
          <p>{error}</p>
        </Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame showHome>
        <form onSubmit={onSubmit} className="space-y-5">
          <h1 className="text-sm text-center">Edit event</h1>

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Description (optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="space-y-2">
            {dates.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="datetime-local"
                  required
                  value={d}
                  onChange={(e) => updateDate(i, e.target.value)}
                />
                {dates.length > 1 && (
                  <button type="button" onClick={() => removeDate(i)}>
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="underline text-xs"
              onClick={addDate}
            >
              + Add date
            </button>
          </div>

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
          >
            <option value="inner">Inner circle</option>
            <option value="friends">Friends</option>
            <option value="public">Public</option>
          </select>

          <button className="button-campaign w-full" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>

          <div className="pt-6 text-center">
            <button
              type="button"
              onClick={cancelEvent}
              disabled={cancelling}
              className="underline text-xs text-red-700"
            >
              {cancelling ? "Cancelling…" : "Cancel event"}
            </button>
          </div>
        </form>
      </Frame>
    </main>
  );
}

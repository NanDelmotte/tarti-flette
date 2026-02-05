// src/app/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";

type Visibility = "inner" | "friends" | "public";

export default function CreateEventPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([""]);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] =
    useState<Visibility>("inner");

  const [isSeries, setIsSeries] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        window.location.replace("/login?redirect=/create");
        return;
      }

      setFirstName(data.user.first_name);
      setLoadingUser(false);
    }

    load();
  }, []);

  function handleDateChange(index: number, value: string) {
    const copy = [...dates];
    copy[index] = value;
    setDates(copy);
  }

  function addDate() {
    setDates((prev) => [...prev, ""]);
  }

  function removeDate(index: number) {
    setDates((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title,
      dates,
      description: description || null,
      location: location || null,
      visibility,
      isSeries,
    };

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create event");
        return;
      }

      window.location.href = `/cirklie/${data.event_id}/share`;
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={firstName} onLogout={handleLogout} showHome>
        <form onSubmit={handleCreate} className="space-y-5 w-full">
          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder={`Event title`}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-2">
            {dates.map((value, index) => (
              <div key={index} className="flex gap-2">
                <input
                  className="flex-1 bg-button rounded-md px-3 py-3"
                  type="datetime-local"
                  required
                  value={value}
                  onChange={(e) =>
                    handleDateChange(index, e.target.value)
                  }
                />
                {isSeries && dates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDate(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <div className="flex gap-3 text-xs">
              <button
                type="button"
                className="underline"
                onClick={() => setIsSeries(!isSeries)}
              >
                {isSeries ? "One date only" : "Add multiple dates"}
              </button>

              {isSeries && (
                <button
                  type="button"
                  className="underline"
                  onClick={addDate}
                >
                  + Add date
                </button>
              )}
            </div>
          </div>

          <textarea
            className="w-full bg-button rounded-md px-3 py-2 text-sm"
            rows={2}
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Location (optional)"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
<h1 className="form-section-title">Who should see this invite?</h1>
          <select
            className="w-full bg-button rounded-md px-3 py-3"
            value={visibility}
            onChange={(e) =>
              setVisibility(e.target.value as Visibility)
            }
          >            <option value="inner">
              Inner circle only
            </option>
            <option value="friends">
              Friends & acquaintances
            </option>
            <option value="public">
              Public link (anyone)
            </option>
          </select>

          {error && (
            <p className="text-xs text-red-700 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-campaign w-full"
          >
            {loading
              ? "Creating…"
              : `Create ${appCopy.noun.singular}`}
          </button>
        </form>
      </Frame>
    </main>
  );
}

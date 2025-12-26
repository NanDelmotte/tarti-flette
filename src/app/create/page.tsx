// src/app/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";
import { createBrowserClient } from "@supabase/ssr";

type Visibility = "inner" | "friends" | "public";

export default function CreateEventPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [isSeries, setIsSeries] = useState(false);
  const [dates, setDates] = useState<string[]>([""]);

  const [visibility, setVisibility] =
    useState<Visibility>("friends");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load profile once */
  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name")
        .single();

      if (error || !data?.first_name || !data?.last_name) {
        setNeedsProfile(true);
      }

      setProfileLoading(false);
    }

    loadProfile();
  }, [supabase]);

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
      first_name: needsProfile ? firstName.trim() : undefined,
      last_name: needsProfile ? lastName.trim() : undefined,
      title,
      description,
      location,
      visibility,
      isSeries,
      dates,
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

  if (profileLoading) {
    return (
      <Frame>
        <p>Loading…</p>
      </Frame>
    );
  }

  return (
    <Frame>
      <form onSubmit={handleCreate} className="space-y-6 w-full">
        {needsProfile && (
          <>
            <div className="space-y-2">
              <label className="form-section-title">
                Your first name
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <label className="form-section-title">
                Your last name
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="form-section-title">
            {appCopy.noun.singular} title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="form-section-title">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="form-section-title">
            Location
          </label>
          <input
            type="text"
            required
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">
            Is this a series or a one-off?
          </span>

          <div className="flex gap-3">
            <button
              type="button"
              className={!isSeries ? "button-campaign" : "bg-button w-full"}
              onClick={() => setIsSeries(false)}
            >
              One-off
            </button>

            <button
              type="button"
              className={isSeries ? "button-campaign" : "bg-button w-full"}
              onClick={() => setIsSeries(true)}
            >
              Series
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="form-section-title">
            {isSeries ? "Dates & times" : "Date & time"}
          </label>

          {dates.map((value, index) => (
            <div key={index} className="flex gap-2">
              <input
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
                  onClick={() =>
                    removeDate(index)
                  }
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {isSeries && (
            <button
              type="button"
              onClick={addDate}
              className="text-xs underline"
            >
              + Add another date
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="form-section-title">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) =>
              setVisibility(
                e.target.value as Visibility
              )
            }
          >
            <option value="inner">
              Inner circle only
            </option>
            <option value="friends">
              Friends & acquaintances
            </option>
            <option value="public">
              Public link (anyone)
            </option>
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-700">
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
  );
}

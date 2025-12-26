"use client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";
import { createBrowserClient } from "@supabase/ssr";

type Visibility = "inner" | "friends" | "public";

export default function CreateEventPage() {
  const [supabase, setSupabase] = useState<any>(null);

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

  // Init Supabase ONLY on client
  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  // Load profile
  useEffect(() => {
    if (!supabase) return;

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

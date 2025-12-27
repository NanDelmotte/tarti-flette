// src/app/create/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";

export const dynamic = "force-dynamic";

type Visibility = "inner" | "friends" | "public";

export default function CreateEventPage() {
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

// Ask the server whether the user already has a profile
useEffect(() => {
async function checkProfile() {
try {
const res = await fetch("/api/profile/check", {
credentials: "include",
});

    const data = await res.json();
    setNeedsProfile(!data.hasProfile);
  } catch {
    setError("Failed to load profile");
  } finally {
    setProfileLoading(false);
  }
}

checkProfile();


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
onChange={(e) => setFirstName(e.target.value)}
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
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </>
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

    {error && (
      <p className="text-xs text-red-700">
        {error}
      </p>
    )}
  </form>
</Frame>


);
}
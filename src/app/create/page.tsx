"use client";

import { useState } from "react";
import Frame from "../../components/Frame";

type Visibility = "inner" | "friends" | "public";

export default function CreateEventPage() {
const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [location, setLocation] = useState("");

const [isSeries, setIsSeries] = useState(false);
const [dates, setDates] = useState<string[]>([""]);

const [visibility, setVisibility] = useState<Visibility>("friends");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

function handleDateChange(index: number, value: string) {
const copy = [...dates];
copy[index] = value;
setDates(copy);
}

function addDate() {
setDates(prev => [...prev, ""]);
}

function removeDate(index: number) {
setDates(prev => prev.filter((_, i) => i !== index));
}

async function handleCreate(e: React.FormEvent) {
e.preventDefault();
setLoading(true);
setError(null);

const token = localStorage.getItem("sb-access-token");
if (!token) {
  setError("You must be logged in.");
  setLoading(false);
  return;
}

const payload = {
  title,
  description,
  location,
  visibility,
  isSeries,
  dates
};

try {
  const res = await fetch("/api/events/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    setError(data.error || "Failed to create Cirklie");
    setLoading(false);
    return;
  }

  // Redirect to share page
  window.location.href = `/cirklie/${data.event_id}/share`;

} catch {
  setError("Network error");
  setLoading(false);
}


}

return (
<Frame>
<form onSubmit={handleCreate} className="space-y-6 text-left w-full">

    {/* TITLE */}
    <div className="space-y-2">
      <label className="form-section-title">Cirklie Event title</label>
      <input
        type="text"
        required
        placeholder="Karaoke/Padel/Football/Drinks"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
    </div>

    {/* DESCRIPTION */}
    <div className="space-y-2">
      <label className="form-section-title">Description</label>
      <textarea
        rows={2}
        placeholder="Optional: add a description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
    </div>

    {/* LOCATION */}
    <div className="space-y-2">
      <label className="form-section-title">Location: Address</label>
      <input
        type="text"
        required
        placeholder="A bar / My house / Mike's Badhuis?"
        value={location}
        onChange={e => setLocation(e.target.value)}
      />
    </div>

    {/* ONE-OFF or SERIES */}
    <div className="space-y-2">
      <span className="block text-sm font-medium">
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

    {/* DATES */}
    <div className="space-y-2">
      <label className="form-section-title">
        {isSeries ? "Dates & times" : "Date & time"}
      </label>

      {dates.map((value, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="datetime-local"
            required
            value={value}
            onChange={e => handleDateChange(index, e.target.value)}
          />
          {isSeries && dates.length > 1 && (
            <button type="button" className="text-xs" onClick={() => removeDate(index)}>
              ✕
            </button>
          )}
        </div>
      ))}

      {isSeries && (
        <button
          type="button"
          onClick={addDate}
          className="text-xs underline opacity-80 link"
        >
          + Add another date
        </button>
      )}
    </div>

    {/* VISIBILITY */}
    <div className="space-y-2">
      <label className="form-section-title">What kind of invite is this?</label>
      <select
        value={visibility}
        onChange={e => setVisibility(e.target.value as Visibility)}
      >
        <option value="inner">Inner circle only</option>
        <option value="friends">Friends & acquaintances</option>
        <option value="public">Public link (anyone)</option>
      </select>
    </div>

    {error && <p className="text-xs text-red-700">{error}</p>}

    {/* SUBMIT */}
    <button type="submit" disabled={loading} className="button-campaign w-full mt-4">
      {loading ? "Creating…" : "Create Cirklie link"}
    </button>

  </form>
</Frame>


);
}
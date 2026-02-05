// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

type Me = {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
};

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        window.location.replace("/login?redirect=/profile");
        return;
      }

      setMe(data.user);
      setFirstName(data.user.first_name);
      setLastName(data.user.last_name || "");
      setEmail(data.user.email);
      setPhone(data.user.phone || "");
    }

    load();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName || null,
        email,
        phone: phone || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data?.error || "Update failed");
    }

    setSaving(false);
  }

  if (!me) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
     <Frame userName={me.first_name} showHome>

        <div className="space-y-4">
          <p className="text-sm text-center">Your profile</p>

          {error && (
            <p className="text-xs text-red-700 text-center">{error}</p>
          )}

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Last name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Phone (e.g. +31612345678)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button
            className="button-campaign w-full"
            disabled={saving}
            onClick={save}
          >
            Save changes
          </button>

          <div className="text-center">
            <button
              className="underline text-xs"
              onClick={() =>
                (window.location.href = "/profile/password")
              }
            >
              Change password
            </button>
          </div>
        </div>
      </Frame>
    </main>
  );
}

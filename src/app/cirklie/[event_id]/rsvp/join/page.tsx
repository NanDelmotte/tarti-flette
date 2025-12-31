"use client";

import { FormEvent, useEffect, useState } from "react";
import Frame from "../../../../../components/Frame";
import { createBrowserClient } from "@supabase/ssr";

export default function RsvpJoinPage({
  params,
}: {
  params: { event_id: string };
}) {
  const redirect = `/cirklie/${params.event_id}/rsvp/respond`;

  const [event, setEvent] = useState<any>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/events/${params.event_id}`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event));
  }, [params.event_id]);

  async function ensureProfile() {
    const res = await fetch("/api/profile/ensure", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Failed to create profile");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // ✅ Supabase client created ONLY on user action
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await ensureProfile();
        window.location.href = redirect;
        return;
      }

      if (!firstName.trim()) {
        throw new Error("First name is required.");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
          },
        },
      });

      if (error) throw error;

      await ensureProfile();
      window.location.href = redirect;
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global">
      <Frame>
        {event && (
          <p className="text-sm opacity-70 mb-2 text-center">
            You’re joining{" "}
            <b>{event.organizer?.first_name ?? "an event"}</b>’s Cirklie
          </p>
        )}

        {error && (
          <p className="text-xs text-red-700 text-center mb-3">{error}</p>
        )}

        <div className="flex gap-2 justify-center mb-4 text-xs">
          <button
            type="button"
            className={mode === "login" ? "underline" : "opacity-70 underline"}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <span className="opacity-60">/</span>
          <button
            type="button"
            className={mode === "signup" ? "underline" : "opacity-70 underline"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          )}

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="button-campaign w-full" disabled={loading}>
            {mode === "login"
              ? "Log in & Continue"
              : "Create account & Continue"}
          </button>
        </form>
      </Frame>
    </main>
  );
}

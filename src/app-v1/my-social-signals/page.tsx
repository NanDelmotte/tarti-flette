// src/app/my-social-signals/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

type Signal = {
  id: string;
  event_title: string;
  interested_name: string;
  created_at: string;
};

export default function MySocialSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      if (!meData?.user) {
        window.location.replace("/login");
        return;
      }

      setFirstName(meData.user.firstName);

      const res = await fetch("/api/my-social-signals");
      const data = await res.json();

      if (!res.ok) {
        setSignals([]);
        setLoading(false);
        return;
      }

      setSignals(data.signals || []);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={firstName} onLogout={handleLogout} showHome showSettings>
        <div className="space-y-4 text-sm">
          <h1 className="h2 text-campaign">My Social Signals</h1>

          {signals.length === 0 && (
            <p className="opacity-60 text-xs">
              No one has signaled interest yet.
            </p>
          )}

          {signals.map((s) => (
            <div key={s.id} className="border-b pb-3">
              <p className="font-medium">{s.interested_name}</p>
              <p className="text-xs opacity-70">
                Interested in <b>{s.event_title}</b>
              </p>
            </div>
          ))}
        </div>
      </Frame>
    </main>
  );
}

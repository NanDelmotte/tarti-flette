// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

export default function DashboardPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        window.location.replace("/login");
        return;
      }

      // FIX: correct field name
      setFirstName(data.user.firstName);
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
        <div className="space-y-6 text-sm">
                
          {/* Primary actions */}
          <div className="space-y-4">
            <a href="/create" className="block">
              <div className="font-medium">Create a new event</div>
              <div className="text-xs opacity-70">
                Start something and invite people
              </div>
            </a>

            <a href="/events" className="block">
              <div className="font-medium">My events</div>
              <div className="text-xs opacity-70">
                Events you host and events you’re attending
              </div>
            </a>

            <a href="/my-chats" className="block">
              <div className="font-medium">My event chats</div>
              <div className="text-xs opacity-70">
                Conversations around your events
              </div>
            </a>

            <a href="/my-social-signals" className="block">
              <div className="font-medium">Friends’ ideas</div>
              <div className="text-xs opacity-70">
                People interested in things you might host
              </div>
            </a>
          </div>
        </div>
      </Frame>
    </main>
  );
}

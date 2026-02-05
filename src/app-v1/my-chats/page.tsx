// src/app/my-chats/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

type ChatEvent = {
  id: string;
  title: string;
};

export default function MyChatsPage() {
  const [chats, setChats] = useState<ChatEvent[]>([]);
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

      setFirstName(meData.user.first_name);

      const res = await fetch("/api/chats/mine");
      const data = await res.json();

      if (!res.ok) {
        window.location.replace("/login");
        return;
      }

      setChats(data.chats || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={firstName} showHome>
        <div className="space-y-3 text-sm">
          {chats.length === 0 && (
            <p className="opacity-60 text-xs">
              You’re not part of any event chats yet.
            </p>
          )}

          {chats.map((event) => (
            <button
              key={event.id}
              className="underline block text-left"
              onClick={() =>
                (window.location.href = `/cirklie/${event.id}/chat`)
              }
            >
              {event.title}
            </button>
          ))}
        </div>
      </Frame>
    </main>
  );
}

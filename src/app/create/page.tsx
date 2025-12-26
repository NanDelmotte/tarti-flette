

export const dynamic = "force-dynamic";

"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";
import { createBrowserClient } from "@supabase/ssr";

export default function CreatePage() {
  const [supabase, setSupabase] = useState<any>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    setSupabase(client);
  }, []);

  if (!supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  async function handleCreate() {
    if (!title.trim()) return;

    await supabase.from("events").insert({
      title,
    });

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame>
        <h1 className="h1 text-campaign mb-4">
          Create a {appCopy.noun.singular}
        </h1>

        <input
          className="w-full bg-button rounded-md px-3 py-2 mb-4"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          className="button-campaign w-full"
          onClick={handleCreate}
        >
          Create
        </button>
      </Frame>
    </main>
  );
}

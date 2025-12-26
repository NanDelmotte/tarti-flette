export const dynamic = "force-dynamic";

"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";
import { appCopy } from "@/lib/appCopy";
import { createClient } from "@supabase/supabase-js";

export default function CreatePage() {
const [supabase, setSupabase] = useState<any>(null);
const [title, setTitle] = useState("");
const [creating, setCreating] = useState(false);

useEffect(() => {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase env vars");
  return;
}

const client = createClient(url, key);
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
if (!title.trim() || creating) return;
setCreating(true);

const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  window.location.replace("/login");
  return;
}

const { data, error } = await supabase
  .from("events")
  .insert({
    title: title.trim(),
    organizer_id: user.id,
  })
  .select("id")
  .single();

setCreating(false);

if (error || !data) {
  console.error(error);
  alert("Could not create event");
  return;
}

window.location.href = `/cirklie/${data.id}`;


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
      disabled={creating}
    >
      {creating ? "Creating…" : "Create"}
    </button>
  </Frame>
</main>


);
}
// src/app/cirklie/[event_id]/rsvp/verified/page.tsx
"use client";

import { useEffect } from "react";

export default function RsvpVerifiedPage({
  params,
}: {
  params: { event_id: string };
}) {
  useEffect(() => {
    // Verified users always continue to respond flow
    window.location.replace(
      `/cirklie/${params.event_id}/rsvp/respond`
    );
  }, [params.event_id]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p className="text-sm opacity-70">Verifying…</p>
    </main>
  );
}

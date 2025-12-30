// src/app/cirklie/[event_id]/rsvp/login/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RsvpLoginRedirectPage({
  params,
}: {
  params: { event_id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(
  `/login?redirect=/cirklie/${params.event_id}/rsvp/respond`
);

  }, [router]);

  return null;
}

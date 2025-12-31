// src/app/cirklie/[event_id]/share/page.tsx
"use client";

import { useEffect, useState } from "react";
import Frame from "../../../../components/Frame";
import QRCode from "qrcode";
import { appCopy } from "@/lib/appCopy";

export default function ShareCirkliePage({
  params,
}: {
  params: { event_id: string };
}) {
  const eventId = params.event_id;

  const [event, setEvent] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // PUBLIC RSVP URL
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/cirklie/${eventId}/rsvp`
      : "";

  useEffect(() => {
    async function fetchEvent() {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();

      setEvent(data.event || null);
      setInstances(data.event?.instances || []);
      setLoading(false);
    }

    fetchEvent();
  }, [eventId]);

  // Generate QR code
  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl).then(setQrDataUrl);
  }, [shareUrl]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
        <Frame>{appCopy.noun.singular} not found.</Frame>
      </main>
    );
  }

  const firstInstance = instances[0];

  const inviterName =
    event.organizer_name ||
    event.organizer?.first_name ||
    "Someone";

  const shareText = `${inviterName} is inviting you to "${event.title}".${
    event.description ? ` ${event.description}` : ""
  } Click the link to RSVP in ${appCopy.noun.singular}.`;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
      <Frame>
        <h1 className="h1 text-campaign">
          Your {appCopy.noun.singular} is ready 🎉
        </h1>

        <div className="space-y-4 mt-4">
          {/* Event summary */}
          <div>
            <h2 className="text-xl font-semibold">{event.title}</h2>

            {event.description && (
              <p className="opacity-80 mt-1">{event.description}</p>
            )}

            {firstInstance && (
              <p className="text-sm opacity-70 mt-1">
                {new Date(firstInstance.datetime).toLocaleString()}
              </p>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`${appCopy.noun.singular} QR code`}
                className="rounded-md shadow"
              />
            )}
          </div>

          {/* Share link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Share this link:
            </label>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full rounded-md bg-button px-3 py-2 text-sm"
              onClick={(e) =>
                (e.target as HTMLInputElement).select()
              }
            />
          </div>

          {/* Native share */}
          <button
            className="button-campaign w-full mt-2"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  text: shareText,
                  url: shareUrl,
                });
              } else {
                alert("Sharing not supported on this device.");
              }
            }}
          >
            Share…
          </button>

          {/* Back to dashboard */}
          <button
            className="button-campaign w-full mt-2"
            onClick={() =>
              (window.location.href = "/dashboard")
            }
          >
            Go to my dashboard
          </button>
        </div>
      </Frame>
    </main>
  );
}

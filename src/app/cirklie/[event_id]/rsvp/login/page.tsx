// src/app/cirklie/[event_id]/rsvp/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "../../../../../components/Frame";

type Step = "details" | "code";

export default function RsvpLoginPage({
  params,
}: {
  params: { event_id: string };
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send SMS");
        return;
      }

      setStep("code");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: code.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid code");
        return;
      }

      router.push(`/cirklie/${params.event_id}/rsvp/verified`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global">
      <Frame>
        <h1 className="h1 text-campaign">Verify to RSVP</h1>

        {error && <p className="text-xs text-red-700">{error}</p>}

        {step === "details" && (
          <form onSubmit={sendCode} className="space-y-3">
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="+31 6 1234 5678"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className="button-campaign w-full" disabled={loading}>
              Send SMS
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="123456"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="button-campaign w-full" disabled={loading}>
              Verify & Continue
            </button>
          </form>
        )}
      </Frame>
    </main>
  );
}

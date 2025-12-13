"use client";

import { FormEvent, useState } from "react";
import Frame from "../../components/Frame";

type Step = "phone" | "code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to request SMS");
        return;
      }

      setMessage("SMS sent!");
      setStep("code");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      // ✅ cookies are already set by the server
      window.location.href = "/dashboard";
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global text-default">
      <Frame>
        <h1 className="h1 text-campaign">Invite people, done.</h1>

        {message && <p className="text-xs opacity-80">{message}</p>}
        {error && (
          <p className="text-xs opacity-80 text-red-700">{error}</p>
        )}

        {step === "phone" && (
          <>
            <form onSubmit={handleSendCode} className="space-y-3">
              <label className="block text-sm font-medium">
                I add my phone number
                <input
                  type="tel"
                  required
                  placeholder="+31 6 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md bg-button px-3 py-3"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="button-campaign"
              >
                {loading ? "Sending…" : "Send me an SMS!"}
              </button>
            </form>

            <p className="text-xs opacity-70">
              We&apos;ll send you a one-time SMS.
            </p>
          </>
        )}

        {step === "code" && (
          <>
            <p className="text-xs opacity-80">Sent to {phone}</p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <label className="block text-sm font-medium">
                Code
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-md bg-button px-3 py-3"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="button-campaign"
              >
                {loading ? "Verifying…" : "Verify code"}
              </button>
            </form>
          </>
        )}
      </Frame>
    </main>
  );
}

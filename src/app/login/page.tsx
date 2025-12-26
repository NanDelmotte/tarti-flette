"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Frame from "../../components/Frame";

type Step = "phone" | "code";

export default function GenericLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function normalizePhone(value: string) {
    // remove spaces, dashes, parentheses
    return value.replace(/[\s\-()]/g, "");
  }

  function isValidPhone(value: string) {
    // very simple, permissive international check
    // starts with + and at least 8 digits total
    return /^\+\d{8,}$/.test(value);
  }

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizePhone(phone);

    if (!isValidPhone(normalized)) {
      setError("Please enter a valid phone number with country code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to send SMS");
        return;
      }

      setPhone(normalized);
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
          phone: phone,
          code: code.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid code");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global">
      <Frame>
        {/* Removed big LOGIN headline */}
        <p className="text-sm opacity-100 mb-2 text-center">
       Make your first invitation
        </p>

        {error && (
          <p className="text-xs text-red-700 text-center mb-3">
            {error}
          </p>
        )}

        {step === "phone" && (
          <form onSubmit={sendCode} className="space-y-4">
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder=" +31612345678"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) =>
                setPhone(normalizePhone(e.target.value))
              }
            />
            <button
              className="button-campaign w-full"
              disabled={loading}
            >
              Join through SMS
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-4">
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="123456"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="button-campaign w-full"
              disabled={loading}
            >
              Verify
            </button>
          </form>
        )}
      </Frame>
    </main>
  );
}

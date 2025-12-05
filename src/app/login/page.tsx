


//Davids test commit

"use client";

import { FormEvent, useState } from "react";

type Step = "phone" | "code" | "success";

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

    await new Promise((r) => setTimeout(r, 500));
    setMessage("Pretend we sent an SMS 🙂");
    setStep("code");
    setLoading(false);
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    await new Promise((r) => setTimeout(r, 500));
    setMessage("You are now logged in (demo).");
    setStep("success");
    setLoading(false);
  }

  return (
    <main className="w-full max-w-md mx-auto p-6">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-lg space-y-4">
        <h1 className="text-2xl font-semibold text-center mb-2">
          tarti-flette login
        </h1>
        <p className="text-sm text-neutral-300 text-center mb-4">
          Simple SMS verification demo (stubbed).
        </p>

        {message && (
          <div className="text-sm text-emerald-400 border border-emerald-700/60 bg-emerald-900/20 rounded-md px-3 py-2">
            {message}
          </div>
        )}
        {error && (
          <div className="text-sm text-rose-400 border border-rose-700/60 bg-rose-900/20 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <label className="block text-sm font-medium">
              Phone number
              <input
                type="tel"
                required
                placeholder="+31 6 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-600 bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium px-4 py-2 hover:bg-white disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-xs text-neutral-400">
              We sent a 6-digit code to <span className="font-mono">{phone}</span>.
            </p>
            <label className="block text-sm font-medium">
              Code
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-600 bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium px-4 py-2 hover:bg-white disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-xs text-neutral-400 hover:text-neutral-200 mt-1"
            >
              Change phone number
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-3 text-center">
            <p className="text-lg font-medium">✅ Logged in (demo)</p>
            <p className="text-sm text-neutral-300">
              At this point, you would create a real session using Supabase auth
              or your own session cookie.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

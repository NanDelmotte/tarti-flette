//src/app/forgot-password/page.tsx

"use client";

import { useState } from "react";
import Frame from "../../components/Frame";
import { createBrowserClient } from "@supabase/ssr";

export default function ForgotPasswordPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function sendReset() {
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/profile/password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess("Check your email for the reset link.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-global">
      <Frame>
        <p className="text-sm text-center mb-2">Reset password</p>

        {error && <p className="text-xs text-red-700 text-center mb-3">{error}</p>}
        {success && <p className="text-xs text-green-700 text-center mb-3">{success}</p>}

        <div className="space-y-4">
          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="button-campaign w-full" onClick={sendReset} disabled={loading}>
            Send reset link
          </button>

          <button
            className="underline text-xs w-full opacity-70"
            type="button"
            onClick={() => (window.location.href = "/login")}
          >
            Back to login
          </button>
        </div>
      </Frame>
    </main>
  );
}

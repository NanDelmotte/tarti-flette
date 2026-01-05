// src/app/login/page.tsx
"use client";

import { FormEvent, Suspense, useState } from "react";
import Frame from "../../components/Frame";
import { createBrowserClient } from "@supabase/ssr";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function ensureProfile() {
    const res = await fetch("/api/profile/ensure", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create profile");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await ensureProfile();
        window.location.href = redirect;
        return;
      }

      if (!firstName.trim()) {
        throw new Error("First name is required.");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName.trim() },
        },
      });

      if (error) throw error;

      await ensureProfile();
      window.location.href = redirect;
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/account/password`,
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
        <p className="text-sm text-center mb-2">Welcome</p>

        {error && (
          <p className="text-xs text-red-700 text-center mb-3">{error}</p>
        )}

        {success && (
          <p className="text-xs text-green-700 text-center mb-3">{success}</p>
        )}

        <div className="flex gap-2 justify-center mb-4 text-xs">
          <button
            type="button"
            className={mode === "login" ? "underline" : "opacity-70 underline"}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <span className="opacity-60">/</span>
          <button
            type="button"
            className={mode === "signup" ? "underline" : "opacity-70 underline"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              className="w-full bg-button rounded-md px-3 py-3"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          )}

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="button-campaign w-full" disabled={loading}>
            {mode === "login" ? "Log in" : "Create account"}
          </button>

          {mode === "login" && (
            <button
              type="button"
              className="text-xs underline opacity-70 w-full"
              onClick={onForgotPassword}
              disabled={loading}
            >
              Forgot your password?
            </button>
          )}
        </form>
      </Frame>
    </main>
  );
}

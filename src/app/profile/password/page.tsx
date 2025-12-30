// src/app/profile/password/page.tsx
"use client";

import { useState } from "react";
import Frame from "../../../components/Frame";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setError(null);
    setOk(false);

    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data?.error || "Failed to change password");
      setSaving(false);
      return;
    }

    setOk(true);
    setPassword("");
    setConfirm("");
    setSaving(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
     <Frame showHome>
        <div className="space-y-4">
          <p className="text-sm text-center">Change password</p>

          {error && (
            <p className="text-xs text-red-700 text-center">{error}</p>
          )}

          {ok && (
            <p className="text-xs text-green-700 text-center">
              Password updated
            </p>
          )}

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="w-full bg-button rounded-md px-3 py-3"
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <button
            className="button-campaign w-full"
            disabled={saving}
            onClick={submit}
          >
            Update password
          </button>

          <div className="text-center">
            <button
              className="underline text-xs"
              onClick={() => (window.location.href = "/profile")}
            >
              Back to profile
            </button>
          </div>
        </div>
      </Frame>
    </main>
  );
}

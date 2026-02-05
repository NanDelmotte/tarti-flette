"use client";

import { useEffect, useState } from "react";
import Frame from "../../components/Frame";

export default function GetStartedPage() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/me");
      const data = await res.json();

      if (!data?.user) {
        window.location.replace("/login");
        return;
      }

      setFirstName(data.user.firstName);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Frame>Loading…</Frame>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Frame userName={firstName} onLogout={handleLogout} showSettings>
        <div className="space-y-5 text-sm">
          <h1 className="h1 text-campaign">Here's a tool </h1>  <h1 className="h2 text-campaign">to help your social life</h1>

         

          <p className="opacity-80">
            Create an event, invite people with a link, and get RSVPs in one place. 
            Once people respond, you’ll see
            if their coming, you can can chat and grow your social circles in a human way. 
          </p>

          <div className="pt-2">
            <a href="/create" className="block">
              <div className="font-medium"><u>Create your first invite</u></div>
              <div className="text-xs opacity-70">
                Start something fun
              </div>
            </a>
          </div>
        </div>
      </Frame>
    </main>
  );
}

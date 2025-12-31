"use client";

import Logo from "./Logo";
import { createBrowserClient } from "@supabase/ssr";

export default function Frame({
  children,
  userName,
  onLogout,
  showHome,
  showSettings,
}: {
  children: React.ReactNode;
  userName?: string | null;
  onLogout?: () => void;
  showHome?: boolean;
  showSettings?: boolean;
}) {
  async function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }

    // Create Supabase client ONLY at runtime, when user clicks logout
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const showUtilityBar = showHome || userName || onLogout || showSettings;

  return (
    <div className="w-full flex flex-col items-center mt-3">
      {showUtilityBar && (
        <div className="utility-bar w-full max-w-sm flex justify-between mb-2 text-xs opacity-70">
          {/* Left: Home */}
          <div>
            {showHome ? (
              <button
                className="underline"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Home
              </button>
            ) : (
              <span />
            )}
          </div>

          {/* Center: Identity */}
          <div>
            {userName && (
              <span>
                Logged in as{" "}
                <span className="font-medium">{userName}</span>
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2 items-center">
            {showSettings && userName && (
              <a href="/profile" className="underline opacity-70">
                Settings
              </a>
            )}

            {(onLogout || userName) && (
              <button className="underline" onClick={handleLogout}>
                Log out
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mb-3">
        <Logo small />
      </div>

      <div className="frame-campaign w-full max-w-sm pt-4 pb-6">
     <div className="frame-content w-full">
  {children}
</div>

      </div>
    </div>
  );
}

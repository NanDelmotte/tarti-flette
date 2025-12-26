"use client";

import Logo from "./Logo";

export default function Frame({
  children,
  userName,
  onLogout,
}: {
  children: React.ReactNode;
  userName?: string | null;
  onLogout?: () => void;
}) {
  return (
    <div className="w-full flex flex-col items-center mt-3">
      {/* Top utility bar */}
      {(userName || onLogout) && (
        <div className="w-full max-w-sm flex justify-end mb-2 text-xs opacity-70 gap-3">
          {userName && <span>{userName}</span>}
          {onLogout && (
            <button className="underline" onClick={onLogout}>
              Log out
            </button>
          )}
        </div>
      )}

      {/* Logo */}
      <div className="mb-3">
        <Logo small />
      </div>

      {/* Poster frame */}
      <div className="frame-campaign w-full max-w-sm pt-4 pb-6">
        {/* THIS is the important part */}
        <div className="frame-content">
          {children}
        </div>
      </div>
    </div>
  );
}

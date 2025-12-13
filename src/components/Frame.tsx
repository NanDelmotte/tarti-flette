"use client";

import Logo from "./Logo";
export default function Frame({
  children,
}: {
  children: React.ReactNode;
}) {
  // read the current theme class from <html> just for debugging
  const theme = typeof document !== "undefined"
    ? document.documentElement.className
    : "";

  return (
    <div
      className="
        w-full
        flex flex-col items-center
        mt-3   /* smaller top spacing */
      "
    >
      {/* Logo */}
      <div className="mb-2">
        <Logo small />
      </div>

      {/* TEMP theme indicator */}
      <p className="text-xs opacity-50 mb-2">
        {theme}
      </p>

      {/* Frame */}
      <div
        className="
          frame-campaign
          w-full
          max-w-sm
          text-center
          space-y-6
          pt-4 pb-6   /* slightly tighter vertical padding */
        "
      >
        {children}
      </div>
    </div>
  );
}

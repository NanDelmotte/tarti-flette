// src/components/ChatFrame.tsx
"use client";

import Logo from "./Logo";

export default function ChatFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full mt-3 px-3 sm:px-4">
      {/* Logo stays centered */}
      <div className="mb-2 flex justify-center">
        <Logo small />
      </div>

      {/* Responsive chat container */}
      <div
        className="
          w-full
          md:max-w-2xl
          lg:max-w-3xl
          mx-auto
          rounded-2xl
          p-4
        "
        style={{
          backgroundColor: "#FFF4DB",
          color: "#000000",
          textAlign: "left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

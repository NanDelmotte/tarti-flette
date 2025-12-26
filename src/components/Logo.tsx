"use client";
import { appCopy } from "@/lib/appCopy";
export default function Logo({ small = false }) {
  const size = small ? "120px" : "200px";

  return (
    <svg
      className="logo-svg"
      viewBox="0 0 200 200"
      style={{
        width: size,
        height: "auto",

        /* NEW — use text color instead of button-bg */
        color: "var(--text)",
        fill: "currentColor",
        stroke: "currentColor",
      }}
    >
      <circle cx="100" cy="100" r="30" opacity="0.15" />
      <circle cx="100" cy="100" r="20" opacity="0.11" />
      <circle cx="100" cy="100" r="10" opacity="0.08" />

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fontSize={small ? 26 : 38}
      >
        {appCopy.appName}
      </text>
    </svg>
  );
}
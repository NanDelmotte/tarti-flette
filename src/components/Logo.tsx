"use client";

import { useEffect, useState } from "react";
import { appCopy } from "@/lib/appCopy";

const AMBIENT_LINES = [
  "A gentle way to include people in real life",
  "Plans don’t have to be complicated",
  "Small plans count",
  "Real life, but lighter",
  "Make space for people",
  "It’s okay to keep things informal",
  "You don’t need a big reason",
  "Inviting people can be simple",
  "Not everything has to be planned perfectly",
  "Sometimes a few people is enough",
  "Include people, gently",
  "People you know. People they know",
  "Invitations can travel",
  "Plans grow through people",
  "Friends of friends welcome",
];

export default function Logo({ small = false }: { small?: boolean }) {
  const [line, setLine] = useState("");

  useEffect(() => {
    const pick =
      AMBIENT_LINES[Math.floor(Math.random() * AMBIENT_LINES.length)];
    setLine(pick);
  }, []);

  const width = small ? 260 : 360;

  return (
    <svg
      className="logo-svg"
      viewBox="0 0 360 200"
      style={{
        width,
        height: "auto",
      }}
    >
      {/* Rings */}
      <circle cx="180" cy="90" r="30" opacity="0.15" />
      <circle cx="180" cy="90" r="20" opacity="0.11" />
      <circle cx="180" cy="90" r="10" opacity="0.08" />

      {/* App name */}
      <text
        x="180"
        y="90"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fontSize={small ? 26 : 38}
      >
        {appCopy.appName}
      </text>

      {/* Ambient phrase — larger & readable */}
      {line && (
        <text
          x="180"
          y="138"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize={small ? 14 : 15}
          opacity="0.85"
        >
          {line}
        </text>
      )}
    </svg>
  );
}

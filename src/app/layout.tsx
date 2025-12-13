"use client";

import "./globals.css";
import "../styles/themes.css";
import "../styles/ui.css";
import Logo from "../components/Logo";


import { Inter } from "next/font/google";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // rotate palette every refresh
  useEffect(() => {
    const palettes = [
      "palette-california-dreaming",
      "palette-coastal-teal",
      "palette-sunset-punch",
      "palette-midnight-electric",
      "palette-party-poster",
      "palette-retro-miami",
      "palette-urban-rally",
      "palette-golden-hour",
    ];

    const html = document.documentElement;
    const chosen = palettes[Math.floor(Math.random() * palettes.length)];

    // remove previous palette classes
    html.classList.forEach((c) => {
      if (c.startsWith("palette-")) html.classList.remove(c);
    });

    html.classList.add(chosen);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}


// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Tarti-flette",
  description: "Minimal RSVP app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

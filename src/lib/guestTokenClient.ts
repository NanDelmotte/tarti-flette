// src/lib/guestTokenClient.ts
"use client";

export function getOrSetGuestTokenCookie(): string {
  const key = "cirklie_guest_token";
  const existing = readCookie(key);
  if (existing) return existing;

  const token = cryptoRandomToken(28);
  document.cookie = `${key}=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return token;
}

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function cryptoRandomToken(len: number) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return b64.slice(0, len);
}

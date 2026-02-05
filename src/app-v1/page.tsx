// src/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const qs = searchParams
    ? "?" +
      new URLSearchParams(
        Object.entries(searchParams).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((vv) => [k, vv]) : v ? [[k, v]] : []
        ) as [string, string][]
      ).toString()
    : "";

  redirect(`/login${qs}`);
}

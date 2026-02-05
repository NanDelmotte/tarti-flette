// src/app/e/[slug]/thanks/page.tsx
import Link from "next/link";
import Shell from "@/components/Shell";

export default function ThanksPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { status?: string };
}) {
  const status = (searchParams.status || "yes").toLowerCase();
  const isNo = status === "no";

  return (
    <Shell
      title={isNo ? "Thanks for letting them know" : "You’re in"}
      subtitle={isNo ? "Appreciated." : "See you there."}
      tightCard
    >
      <div className="c-stack" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, lineHeight: 1 }}>{isNo ? "🫶" : "🎉"}</div>

        <Link href={`/e/${params.slug}/details`} className="c-btnPrimary">
          View event details
        </Link>

        <Link href={`/e/${params.slug}`} className="c-btnLink">
          Change RSVP
        </Link>
      </div>
    </Shell>
  );
}

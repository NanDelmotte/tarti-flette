// src/app/create/page.tsx
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { paletteForGif } from "@/lib/palette";

export default function CreatePage() {
  const paletteKey = paletteForGif(null); // default = zen

  return (
    <Shell
      title="Create an invite"
      subtitle="One minute. No login."
      paletteKey={paletteKey}
    >
      <div className="c-stack">
        <a href="/create/details?step=1" className="c-btnPrimary">
          Start
        </a>

        <div className="c-help">
          You’ll pick a vibe and (optionally) add an image later.
        </div>
      </div>
    </Shell>
  );
}

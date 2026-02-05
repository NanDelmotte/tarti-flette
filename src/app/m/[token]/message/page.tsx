// src/app/m/[token]/message/page.tsx
import { redirect } from "next/navigation";

export default async function ManageMessageRedirect({
  params,
}: {
  params: { token: string };
}) {
  redirect(`/m/${params.token}/guests`);
}

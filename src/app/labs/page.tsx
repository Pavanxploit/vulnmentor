import { redirect } from "next/navigation";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function LabsRoute() {
  await requireAuthenticatedPage("/labs");
  redirect("/dashboard#labs");
}

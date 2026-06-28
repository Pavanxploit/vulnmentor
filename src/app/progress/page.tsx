import { ProgressPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Progress | VulnMentor",
  description: "Review VulnMentor lab completion, points, attempts, and accuracy.",
};

export default async function ProgressRoute() {
  await requireAuthenticatedPage("/progress");
  return <ProgressPage />;
}

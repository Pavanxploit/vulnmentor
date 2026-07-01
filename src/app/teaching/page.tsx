import { TeachingPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Teaching | VulnMentor",
  description: "Step-by-step VulnMentor teaching modules before students solve labs.",
};

export default async function TeachingRoute() {
  await requireAuthenticatedPage("/teaching");
  return <TeachingPage />;
}

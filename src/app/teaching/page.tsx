import { TeachingPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Teaching Hub | VulnMentor",
  description: "Foundation lessons, Web security, API security, and defender-thinking modules before students solve labs.",
};

export default async function TeachingRoute() {
  await requireAuthenticatedPage("/teaching");
  return <TeachingPage />;
}

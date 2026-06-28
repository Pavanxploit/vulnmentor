import { DashboardPage } from "@/components/academy/dashboard-page";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | VulnMentor",
  description: "Continue VulnMentor cybersecurity learning paths and labs.",
};

export default async function DashboardRoute() {
  await requireAuthenticatedPage("/dashboard");
  return <DashboardPage />;
}

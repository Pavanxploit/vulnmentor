import { SettingsPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings | VulnMentor",
  description: "Manage VulnMentor account and local sandbox settings.",
};

export default async function SettingsRoute() {
  await requireAuthenticatedPage("/settings");
  return <SettingsPage />;
}

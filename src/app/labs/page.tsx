import { LabsDirectoryPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Labs | VulnMentor",
  description: "Browse VulnMentor Web and API security labs.",
};

export default async function LabsRoute() {
  await requireAuthenticatedPage("/labs");
  return <LabsDirectoryPage />;
}

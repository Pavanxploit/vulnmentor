import { GuideConsolePage } from "@/components/academy/guide-console-page";
import { requireRolePage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Guide Console | VulnMentor",
  description: "Review VulnMentor challenge readiness, lab metadata, and authoring coverage.",
};

export default async function GuideRoute() {
  await requireRolePage("/guide", ["instructor"]);
  return <GuideConsolePage />;
}

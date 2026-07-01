import { RoadmapPage } from "@/components/academy/roadmap-page";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roadmap | VulnMentor",
  description: "0-to-hero Web, API, and defender-thinking learning path for VulnMentor.",
};

export default async function RoadmapRoute() {
  await requireAuthenticatedPage("/roadmap");
  return <RoadmapPage />;
}

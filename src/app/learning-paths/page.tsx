import { LearningPathsPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Learning Paths | VulnMentor",
  description: "Follow VulnMentor cybersecurity learning paths from beginner to practical defense.",
};

export default async function LearningPathsRoute() {
  await requireAuthenticatedPage("/learning-paths");
  return <LearningPathsPage />;
}

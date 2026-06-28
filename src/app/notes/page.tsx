import { NotesPage } from "@/components/academy/workspace-pages";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notes | VulnMentor",
  description: "Write and save local cybersecurity practice notes in VulnMentor.",
};

export default async function NotesRoute() {
  await requireAuthenticatedPage("/notes");
  return <NotesPage />;
}

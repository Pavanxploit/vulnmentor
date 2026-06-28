import { AdminPage } from "@/components/academy/admin-page";

export const metadata = {
  title: "Admin Console | VulnMentor",
  description: "Review VulnMentor challenge readiness, lab metadata, and authoring coverage.",
};

export default function AdminRoute() {
  return <AdminPage />;
}

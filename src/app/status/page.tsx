import Link from "next/link";
import { requireAuthenticatedPage } from "@/lib/auth-guards";
import { LabHealthPanel } from "@/components/academy/lab-health-panel";

export default async function StatusPage() {
  await requireAuthenticatedPage("/status");
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6 text-slate-100">
      <Link href="/dashboard" className="text-cyan-200">
        Dashboard
      </Link>
      <h1 className="text-3xl font-semibold">System status</h1>
      <LabHealthPanel />
    </main>
  );
}

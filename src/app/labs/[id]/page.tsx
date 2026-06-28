import { notFound } from "next/navigation";
import { LabDetailPage } from "@/components/academy/lab-detail-page";
import { challenges } from "@/data/challenges";

export function generateStaticParams() {
  return challenges.map((challenge) => ({ id: challenge.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = challenges.find((item) => item.id === id);

  if (!challenge) {
    return {
      title: "Lab Not Found | VulnMentor",
    };
  }

  return {
    title: `${challenge.title} | VulnMentor`,
    description: challenge.summary,
  };
}

export default async function LabRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = challenges.find((item) => item.id === id);

  if (!challenge) {
    notFound();
  }

  return <LabDetailPage challenge={challenge} />;
}

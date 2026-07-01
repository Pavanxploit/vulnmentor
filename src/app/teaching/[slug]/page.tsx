import { notFound } from "next/navigation";
import { TeachingLessonPage } from "@/components/academy/teaching-lesson-page";
import {
  allTeachingLessons,
  getNextTeachingLesson,
  getTeachingLesson,
} from "@/data/teaching";
import { requireAuthenticatedPage } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return allTeachingLessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getTeachingLesson(slug);

  if (!lesson) {
    return {
      title: "Lesson Not Found | VulnMentor",
    };
  }

  return {
    title: `${lesson.title} | VulnMentor Teaching`,
    description: lesson.summary,
  };
}

export default async function TeachingLessonRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireAuthenticatedPage(`/teaching/${slug}`);
  const lesson = getTeachingLesson(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <TeachingLessonPage
      lesson={lesson}
      nextLesson={getNextTeachingLesson(slug)}
    />
  );
}

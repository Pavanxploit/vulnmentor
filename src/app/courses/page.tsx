import { randomUUID } from "node:crypto";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedPage, requireRolePage } from "@/lib/auth-guards";
import { relationalStatement } from "@/lib/store/relational";
import { classesAvailable } from "@/lib/store/classes-store";
import { challenges } from "@/data/challenges";

type Module = {
  id: string;
  title: string;
  course_title: string;
  path_title: string;
};
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  body: string;
  lab_id: string | null;
  author_id: string;
};
async function saveLesson(data: FormData) {
  "use server";
  const { student } = await requireRolePage("/courses", ["instructor"]);
  if (!classesAvailable())
    throw new Error("Courses require SQLite or PostgreSQL.");
  const field = (key: string) => String(data.get(key) || "").trim();
  const title = field("title"),
    body = field("body"),
    moduleId = field("module"),
    lab = field("lab"),
    id = field("id");
  if (
    !title ||
    title.length > 140 ||
    !body ||
    body.length > 8000 ||
    (lab && !challenges.some((c) => c.id === lab))
  )
    throw new Error("Check the title, content and linked lab.");
  if (
    !(await relationalStatement("SELECT 1 FROM course_modules WHERE id=?").get(
      moduleId,
    ))
  )
    throw new Error("Unknown module.");
  if (id) {
    const result = await relationalStatement(
      "UPDATE course_lessons SET title=?,body=?,module_id=?,lab_id=? WHERE id=? AND author_id=?",
    ).run(title, body, moduleId, lab || null, id, student.id);
    if (!result.changes) throw new Error("Lesson unavailable.");
  } else {
    await relationalStatement(
      "INSERT INTO course_lessons(id,module_id,title,body,lab_id,author_id,created_at) VALUES(?,?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      moduleId,
      title,
      body,
      lab || null,
      student.id,
      new Date().toISOString(),
    );
  }
  revalidatePath("/courses");
}
function Editor({ modules, lesson }: { modules: Module[]; lesson?: Lesson }) {
  return (
    <form
      action={saveLesson}
      className="grid gap-4 rounded-md border border-slate-700 p-4"
    >
      <input type="hidden" name="id" value={lesson?.id || ""} />
      <label>
        Title
        <input
          className="block w-full bg-slate-800 p-2"
          name="title"
          required
          maxLength={140}
          defaultValue={lesson?.title}
        />
      </label>
      <label>
        Module
        <select
          className="block bg-slate-800 p-2"
          name="module"
          defaultValue={lesson?.module_id}
        >
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Lesson text
        <textarea
          className="block w-full bg-slate-800 p-2"
          name="body"
          required
          maxLength={8000}
          rows={5}
          defaultValue={lesson?.body}
        />
      </label>
      <label>
        Linked lab
        <select
          className="block bg-slate-800 p-2"
          name="lab"
          defaultValue={lesson?.lab_id || ""}
        >
          <option value="">Theory only</option>
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded bg-cyan-200 p-2 text-slate-950">
        {lesson ? "Save changes" : "Publish lesson"}
      </button>
    </form>
  );
}
export default async function Courses() {
  const { student } = await requireAuthenticatedPage("/courses");
  if (!classesAvailable())
    return (
      <main className="p-8">
        <Link href="/teaching">Teaching Hub</Link>
        <p>Instructor-authored courses require SQLite or PostgreSQL.</p>
      </main>
    );
  const modules = (await relationalStatement(
    "SELECT m.id,m.title,c.title AS course_title,p.title AS path_title FROM course_modules m JOIN courses c ON m.course_id=c.id JOIN path_courses pc ON pc.course_id=c.id JOIN learning_paths p ON p.id=pc.path_id ORDER BY p.id,pc.position,m.position",
  ).all()) as Module[];
  const lessons = (await relationalStatement(
    "SELECT * FROM course_lessons ORDER BY created_at,id",
  ).all()) as Lesson[];
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6 text-slate-100">
      <Link className="text-cyan-200" href="/teaching">
        Teaching Hub
      </Link>
      <h1 className="text-3xl font-semibold">Instructor lessons</h1>
      {student.role === "instructor" && (
        <details>
          <summary>Add a lesson</summary>
          <Editor modules={modules} />
        </details>
      )}
      {modules.map((m) => (
        <section
          key={m.id}
          className="space-y-3 rounded-lg border border-slate-700 p-5"
        >
          <p className="text-sm text-cyan-200">
            {m.path_title} / {m.course_title}
          </p>
          <h2 className="text-xl">{m.title}</h2>
          {!lessons.some((l) => l.module_id === m.id) && (
            <p>No published lessons yet.</p>
          )}
          {lessons
            .filter((l) => l.module_id === m.id)
            .map((l) => (
              <article key={l.id}>
                <h3 className="font-bold">{l.title}</h3>
                <p className="whitespace-pre-wrap">{l.body}</p>
                {l.lab_id && (
                  <Link className="text-cyan-200" href={"/labs/" + l.lab_id}>
                    Open linked lab
                  </Link>
                )}
                {student.id === l.author_id && (
                  <details>
                    <summary>Edit lesson</summary>
                    <Editor modules={modules} lesson={l} />
                  </details>
                )}
              </article>
            ))}
        </section>
      ))}
    </main>
  );
}

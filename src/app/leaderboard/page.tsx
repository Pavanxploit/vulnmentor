import Link from "next/link";
import { challenges } from "@/data/challenges";
import { requireAuthenticatedPage } from "@/lib/auth-guards";
import { classesAvailable } from "@/lib/store/classes-store";
import { relationalStatement } from "@/lib/store/relational";

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { student } = await requireAuthenticatedPage("/leaderboard");
  const { group = "all" } = await searchParams;
  const tracks = Array.from(new Set(challenges.map((l) => l.category)));
  const labs = challenges.filter(
    (l) => group === "all" || group === l.id || group === l.category,
  );
  const rows =
    classesAvailable() && labs.length
      ? ((await relationalStatement(
          `SELECT c.user_id,COUNT(*) AS solves,MAX(c.completed_at) AS finished FROM completed_labs c JOIN users u ON u.id=c.user_id WHERE u.role='student' AND c.challenge_id IN (${labs.map(() => "?").join(",")}) GROUP BY c.user_id ORDER BY solves DESC,finished ASC,c.user_id LIMIT 50`,
        ).all(...labs.map((l) => l.id))) as {
          user_id: string;
          solves: number;
          finished: string;
        }[])
      : [];
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 p-6 text-slate-100">
      <Link className="text-cyan-200" href="/progress">
        Progress report
      </Link>
      <h1 className="text-3xl font-semibold">Student leaderboard</h1>
      <p>Ranked by labs solved, then by earliest completion.</p>
      <form className="flex gap-3">
        <label>
          Track or lab{" "}
          <select
            name="group"
            className="bg-slate-800 p-2"
            defaultValue={group}
          >
            <option value="all">All tracks</option>
            {tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
            {challenges.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded bg-cyan-200 px-3 text-slate-950">
          Apply
        </button>
      </form>
      {!classesAvailable() ? (
        <p>Rankings require SQLite or PostgreSQL.</p>
      ) : rows.length === 0 ? (
        <p>No recorded completions for this selection.</p>
      ) : (
        <ol className="list-inside list-decimal space-y-3">
          {rows.map((row) => (
            <li key={row.user_id}>
              {row.user_id === student.id
                ? "You"
                : "Student " + row.user_id.slice(0, 8)}{" "}
              · {row.solves}/{labs.length} solved
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

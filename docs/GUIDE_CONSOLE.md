# VulnMentor Guide Console

The Instructor Guide Console is available at:

```text
http://127.0.0.1:3000/guide
```

It helps a guide review the lab catalog before a class demo or project evaluation. This route is instructor-only.

## What It Tracks

- Lab title, category, difficulty, points, and status
- Verifier ID used by the flag submission endpoint
- Docker service name and local runtime port
- Hint coverage, root-cause notes, secure-code coverage, and mitigation notes
- Authoring snapshot for the selected challenge
- Total and active student counts
- Lab completion percentage
- Average saved quiz score
- Most failed labs
- Most used hints
- Recent flag attempts
- Student-wise progress, attempts, accuracy, quiz score, and last active time

## Challenge Source

Challenge metadata is currently stored in:

```text
src/data/challenges.ts
```

Each challenge should include:

- `id`
- `title`
- `category`
- `difficulty`
- `verifierId`
- `points`
- `summary`
- `workflow`
- `hints`
- `rootCause`
- `mitigation`
- `code.vulnerable`
- `code.secure`
- `lab.baseUrl`
- `lab.healthUrl`
- `lab.tracesUrl`
- `lab.serviceName`

## Review Checklist

Before presenting or adding a new lab:

1. Keep the vulnerable service on localhost or a private lab network.
2. Confirm the Docker service starts with `docker compose up --build -d`.
3. Confirm the health endpoint returns `ok`.
4. Confirm the trace endpoint shows lab activity.
5. Keep real flags out of the README and public documentation.
6. Add at least three progressive hints.
7. Add root cause, impact, mitigation, and secure-code comparison.
8. Confirm the portal can verify the captured flag.

## Access

Public registration creates student accounts. Instructor access should be created only through the protected setup/API flow by sending `role: "instructor"` with `VULNMENTOR_INSTRUCTOR_CODE`.

Two narrow exceptions exist:

| Case | Condition |
| --- | --- |
| First-run bootstrap | The database has no users **and** `VULNMENTOR_INSTRUCTOR_CODE` is unset |
| Demo/screenshot seeding | `VULNMENTOR_ALLOW_TEST_INSTRUCTORS=true` **and** not production **and** the email ends in `.test` |

Demo seeding is an explicit opt-in. It previously applied to any non-production run, which meant that a dev server reachable on a classroom LAN would grant the Guide Console — including every student's analytics — to anyone who registered with a `.test` address. Set the variable only while capturing screenshots:

```bash
VULNMENTOR_ALLOW_TEST_INSTRUCTORS=true npm run dev
```

Accounts that already hold the instructor role are unaffected; this gate only governs new registrations.

## Classes And Batches

Create a class for a cohort ("CSE 2026 Batch A") or a practice group ("eJPT Practice Group"). Each class carries a name, an optional description, a creation date, an active or archived status, and a short join code.

**Join codes** are seven characters drawn from an alphabet with no `0`, `O`, `1`, `I`, or `L`, so a code read aloud or copied off a whiteboard cannot be mistyped into a different valid code. They are matched case-insensitively — a student can type `evn6brz` for `EVN6BRZ`. **New join code** issues a fresh one and immediately invalidates the old one; use it if a code leaks outside the class.

Each class card shows student count, average completion across the group, and how many students were active in the last seven days. **View students** opens the roster with per-student labs solved, attempts, accuracy, and join date.

| Action | Who |
| --- | --- |
| Create, archive, restore | Instructor who owns the class |
| Regenerate join code | Instructor who owns the class |
| Remove a student | Instructor who owns the class |
| Join with a code | Any signed-in student |

Every instructor action is scoped to the owning instructor in the query itself, so a class id belonging to another instructor returns "not found" rather than being acted on.

**Removing a student** deletes one enrolment row. Their account, solved labs, attempts, quiz results, hint usage, evidence notebooks, and generated reports are all untouched, and they can rejoin with the current code.

**Archiving** hides a class from the active list and stops it accepting new students. Enrolments and all data are kept, and **Restore** brings it back.

Class membership is presentational: it groups students for your reporting. Labs, lessons, and progress work exactly the same whether or not a student has joined anything.

Classes require the SQLite provider. Running with `VULNMENTOR_DATABASE_PROVIDER=json` returns a clear message instead — see [DATABASE_PLAN.md](DATABASE_PLAN.md).

## Lab Health

The console shows every Docker lab as Up, Starting, Down, or Unknown, with its target URL, the reason for the state, and when it was last checked. Status is cached server-side for 10 seconds and refreshed in the browser every 15.

Instructors get **Restart all** and a per-lab **Restart**. This is instructor-only: labs are shared, so a student restarting one would clear traces, comments, and counters that classmates are still working through. Hiding the button is presentation only — the API enforces the role independently, checks the request origin, and rate-limits restarts to six per five minutes.

Only the compose service names declared in `src/data/challenges.ts` are accepted, and Docker runs with an argument array rather than a shell string.

See [RUN_LOCALLY.md](RUN_LOCALLY.md#6-lab-health-manager) for the full status table.

## Exports

The console can export instructor analytics as:

- CSV for spreadsheet review
- JSON for project demo evidence or later dashboard integrations

These exports should be used only for authorized class or project review.

## Current Scope

The console is a presentation-ready catalog, readiness board, and instructor analytics dashboard. Challenge editing is intentionally code-controlled in this phase so lab definitions stay versioned through Git.

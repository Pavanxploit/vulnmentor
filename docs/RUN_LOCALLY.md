# Run VulnMentor Locally

Use this guide whenever you want to start the portal and the vulnerable labs on your laptop.

## 1. Open The Project

```bash
cd "C:\Users\jeeva\Documents\New project\vulnmentor"
```

## 2. Start Docker Desktop

Open Docker Desktop and wait until it says the engine is running.

If this command fails:

```bash
docker compose up --build -d
```

with a Docker API or daemon error, Docker Desktop is not fully started yet.

## 3. Start The Labs

```bash
docker compose up --build -d
```

This starts:

```text
SQL Injection lab: http://127.0.0.1:4010
Stored XSS comment lab: http://127.0.0.1:4060
API BOLA / IDOR lab: http://127.0.0.1:4020
API JWT tampering lab: http://127.0.0.1:4030
API Rate Limit Bypass lab: http://127.0.0.1:4040
API Excessive Data Exposure lab: http://127.0.0.1:4050
```

Check health:

```bash
curl http://127.0.0.1:4010/health
curl http://127.0.0.1:4060/health
curl http://127.0.0.1:4020/health
curl http://127.0.0.1:4030/health
curl http://127.0.0.1:4040/health
curl http://127.0.0.1:4050/health
```

All should return:

```text
ok
```

## 4. Start The Portal

Open a second terminal in the same project folder:

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
http://127.0.0.1:3000/register
http://127.0.0.1:3000/login
http://127.0.0.1:3000/dashboard
http://127.0.0.1:3000/roadmap
http://127.0.0.1:3000/teaching
http://127.0.0.1:3000/teaching/sql-injection
http://127.0.0.1:3000/teaching/api-bola
http://127.0.0.1:3000/learning-paths
http://127.0.0.1:3000/labs
http://127.0.0.1:3000/progress
http://127.0.0.1:3000/notes
http://127.0.0.1:3000/settings
http://127.0.0.1:3000/guide
```

## 5. Use The Platform

1. Create an account or sign in.
2. Open Teaching Hub and choose the Start from 0, Web Security, API Security, or Defender Thinking track.
3. Open Roadmap to understand the beginner-to-advanced order.
4. Study the lesson page: beginner explanation, mental model, safe methodology, evidence checklist, fix, quiz, and report note.
5. Open Learning Paths to follow the recommended order.
6. Select a lab from the sidebar.
7. Filter by category or difficulty if you want only Web, API, Easy, Medium, or Hard labs.
8. Open the lab with the `Open Lab` button.
9. Solve the vulnerability inside the local Docker lab and capture the flag.
10. Submit the flag in the portal.
11. Save your evidence notebook on the lab page.
12. Generate a Markdown, JSON, or CSV report from the report generator.
13. Read the root cause, mitigation, post-lab debrief, and report note.

## 6. Lab Health Manager

The portal checks every lab for you. Status appears on the Dashboard, on each lab page, and in the Guide Console.

| Status | Meaning |
| --- | --- |
| **Up** | The lab's `/health` endpoint answered. |
| **Starting** | Docker reports the container running, but it is not answering yet. Wait a few seconds. |
| **Down** | The container is stopped, missing, or refusing connections. |
| **Unknown** | No Docker lab is defined for that challenge yet. |

Each entry shows the target URL, why it is in that state, and when it was last checked.

Checks run on the server and are cached for 10 seconds, so a full class watching the dashboard produces one probe round rather than one per student per lab. The browser refreshes every 15 seconds, and **Refresh** forces an immediate re-read.

Instructors also get **Restart all** and a per-lab **Restart** in the Guide Console and on the Dashboard. Restart is instructor-only on purpose: labs are shared, so a student restarting one would wipe the traces, comments, and counters that classmates are part-way through capturing. Students still reset their own work with the commands below.

The restart endpoint accepts only the compose service names declared in `src/data/challenges.ts` and runs Docker with an argument array rather than a shell string, so nothing from a request can reach a command line.

If Docker Desktop is not running, the panel says so and falls back to reporting whether each lab answers on its port.

## 6b. Classes And Batches

Instructors create classes in the Guide Console and share a seven-character join code. Students enter it under **My Classes** on their dashboard.

Joining is optional and affects nothing about practice: all labs, lessons, and progress work the same whether or not a student has joined a class. Removing a student from a class never touches their account or results.

Requires the SQLite provider. See [GUIDE_CONSOLE.md](GUIDE_CONSOLE.md#classes-and-batches).

## 7. Reset Labs

Each lab page shows a reset command for its Docker service. Use it when traces, comments, tokens, counters, or captured proof should be cleared.

```bash
docker compose restart sql-injection-login
docker compose restart stored-xss-comment
docker compose restart api-broken-auth
docker compose restart api-jwt-tampering
docker compose restart api-rate-limit-bypass
docker compose restart api-excessive-data-exposure
```

For a full clean sandbox:

```bash
docker compose down
docker compose up --build -d
```

Account progress is stored in `.data/vulnmentor.sqlite`. Upgrading an existing JSON install takes one command — see [DATABASE_PLAN.md](DATABASE_PLAN.md):

```bash
npm run migrate:sqlite
```

To run against the original flat-file store instead, set `VULNMENTOR_DATABASE_PROVIDER=json`.

Public registration creates student accounts. Instructor accounts should be created only through the protected setup/API flow with `role: "instructor"` and `VULNMENTOR_INSTRUCTOR_CODE`.

Seeding `.test` instructor accounts for demos now requires an explicit opt-in, `VULNMENTOR_ALLOW_TEST_INSTRUCTORS=true`. See [GUIDE_CONSOLE.md](GUIDE_CONSOLE.md#access) for the full rule.

The store keeps rolling snapshots in `.data/backups/` (one per 15 minutes of write activity, newest 20 retained). They are gitignored along with the rest of `.data/`.

## Platform Security Controls

These protect the portal itself. They are separate from the deliberate vulnerabilities inside the labs.

| Control | Where | Behaviour |
| --- | --- | --- |
| Rate limiting | login, register, flag submission | 10 sign-ins per account per 5 min, 5 registrations per 15 min, 30 flags per min. Returns `429` with `Retry-After`. |
| Origin checking | every state-changing route | Rejects requests whose `Origin` is not the portal. |
| CSV hardening | every export | Cells starting `=`, `+`, `-`, or `@` are prefixed so spreadsheets treat them as text. |
| Evidence containment | Markdown reports | Raw captures render as indented code; prose fields escape HTML. |
| Idle session timeout | session lookup | Sessions die after 3 days unused, independent of the 14-day cap. |

`SameSite=Lax` alone does not isolate the portal from the labs: a site is scheme plus registrable domain, so `127.0.0.1:4060` and `localhost:3000` count as the same site and the cookie would ride along. The `Origin` check is what actually blocks a payload landed in a lab from driving the portal API with a student's session.

Verify the controls with the portal running:

```bash
npm run security-check
```

## 8. Stop Everything

Stop the portal with `Ctrl + C` in the terminal running `npm run dev`.

Stop Docker labs:

```bash
docker compose down
```

## 9. Common Fixes

Use `127.0.0.1` instead of `localhost` if a browser tab keeps loading.

If port `3000` is already used:

```bash
npm run dev -- --port 3001
```

For screenshots on a different portal port:

```powershell
$env:PORTAL_URL="http://localhost:3001"
npm run screenshots
```

If Docker labs do not start, open Docker Desktop first and wait for the engine to become ready.

## 10. Validate Before Demo

Run these checks before a college demo or GitHub push:

```bash
npm run lint
npm run validate
npm run build
```

The validation script checks challenge metadata, teaching coverage, protected instructor routes, flag safety, and required documentation.

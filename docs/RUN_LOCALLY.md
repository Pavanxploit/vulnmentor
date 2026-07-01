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

## 6. Reset Labs

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

Account progress is stored in `.data/vulnmentor-progress.json`. Public registration creates student accounts. Instructor accounts should be created only through the protected setup/API flow with `role: "instructor"` and `VULNMENTOR_INSTRUCTOR_CODE`.

## 7. Stop Everything

Stop the portal with `Ctrl + C` in the terminal running `npm run dev`.

Stop Docker labs:

```bash
docker compose down
```

## 8. Common Fixes

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

## 9. Validate Before Demo

Run these checks before a college demo or GitHub push:

```bash
npm run lint
npm run validate
npm run build
```

The validation script checks challenge metadata, teaching coverage, protected instructor routes, flag safety, and required documentation.

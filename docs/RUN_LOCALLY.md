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
http://127.0.0.1:3000/admin
```

## 5. Use The Platform

1. Select a lab from the sidebar.
2. Filter by category or difficulty if you want only Web, API, Easy, Medium, or Hard labs.
3. Open the lab with the `Open Lab` button.
4. Solve the vulnerability and capture the flag.
5. Submit the flag in the portal.
6. Open the Attack tab to refresh traces.
7. Read Root Cause and Defense tabs for explanation and mitigation.

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

Portal progress is stored in your browser. Use `Reset Local Progress` in the mentor panel to clear a solved lab from the current browser.

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

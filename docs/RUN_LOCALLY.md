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
API BOLA / IDOR lab: http://127.0.0.1:4020
API JWT tampering lab: http://127.0.0.1:4030
```

Check health:

```bash
curl http://127.0.0.1:4010/health
curl http://127.0.0.1:4020/health
curl http://127.0.0.1:4030/health
```

Both should return:

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
```

## 5. Use The Platform

1. Select a lab from the sidebar.
2. Open the lab with the `Open Lab` button.
3. Solve the vulnerability and capture the flag.
4. Submit the flag in the portal.
5. Open the Attack tab to refresh traces.
6. Read Root Cause and Defense tabs for explanation and mitigation.

## 6. Stop Everything

Stop the portal with `Ctrl + C` in the terminal running `npm run dev`.

Stop Docker labs:

```bash
docker compose down
```

## 7. Common Fixes

Use `127.0.0.1` instead of `localhost` if a browser tab keeps loading.

If port `3000` is already used:

```bash
npm run dev -- --port 3001
```

If Docker labs do not start, open Docker Desktop first and wait for the engine to become ready.

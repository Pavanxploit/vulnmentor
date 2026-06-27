# Testing Guide

Use this guide after each build step.

## 1. Check The Portal

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Check:

- Page loads without console errors.
- Labs appear in the sidebar.
- SQL Injection lab opens.
- Hints reveal one by one.
- Flag form accepts input.
- Brief, Attack, Root Cause, and Defense tabs work.

## 2. Check The Docker Lab

```bash
docker compose up --build
```

Open:

```text
http://localhost:4010
```

Check:

- Login form loads.
- Normal invalid login fails.
- SQL injection payload reaches the vulnerable query.
- Flag is shown only after successful bypass.
- `/health` returns `ok`.
- `/traces` returns recent login attempts.

## 3. Check Portal To Lab Connection

With both portal and Docker lab running:

- Open `http://localhost:3000`
- Select the SQL Injection lab.
- Check lab status in the portal.
- Open the Attack tab.
- Perform login attempts in the lab.
- Refresh traces in the portal.

## 4. Check Before Committing

```bash
npm run lint
npm run build
```

Both commands should pass.

## 5. What To Report After Testing

Tell Codex:

- What command failed, if any.
- What page looked confusing.
- Whether Docker started correctly.
- Whether the health check showed online.
- Whether the flag flow felt understandable.

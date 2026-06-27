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
- SQL Injection and API Broken Authorization labs open.
- Hints reveal one by one.
- Flag form accepts input.
- Brief, Attack, Root Cause, and Defense tabs work.

## 2. Check The Docker Labs

```bash
docker compose up --build -d
```

Open:

```text
http://127.0.0.1:4010
http://127.0.0.1:4020
```

Check SQL Injection lab:

- Login form loads.
- Normal invalid login fails.
- SQL injection payload reaches the vulnerable query.
- Flag is shown only after successful bypass.
- `/health` returns `ok`.
- `/traces` returns recent login attempts.

Check API Broken Authorization lab:

- Home page loads.
- `/api/me?token=student-token` returns the student profile.
- `/api/accounts/1001?token=student-token` returns the student's own account.
- Changing the account id reaches the vulnerable object access path.
- `/secure/api/accounts/1002?token=student-token` blocks cross-user access.
- `/health` returns `ok`.
- `/traces` returns recent API attempts.

## 3. Check Portal To Lab Connection

With the portal and Docker labs running:

- Open `http://127.0.0.1:3000`
- Select each live lab.
- Check lab status in the portal.
- Open the Attack tab.
- Perform attempts in the lab.
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

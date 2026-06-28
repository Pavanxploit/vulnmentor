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
- SQL Injection, API Broken Authorization, JWT Tampering, Rate Limit Bypass, and Excessive Data Exposure labs open.
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
http://127.0.0.1:4030
http://127.0.0.1:4040
http://127.0.0.1:4050
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

Check API JWT Tampering lab:

- Home page loads.
- `/api/token/student` returns a student token.
- `/api/debug/decode?token=<token>` shows the token header and payload.
- Vulnerable admin report endpoint trusts tampered claims.
- Secure admin report endpoint rejects unsigned or tampered tokens.
- `/health` returns `ok`.
- `/traces` returns recent JWT attempts.

Check API Rate Limit Bypass lab:

- Home page loads.
- `/api/otp/start` returns a local OTP challenge.
- Wrong OTP attempts reduce the remaining counter.
- Spoofing `X-Forwarded-For` changes the vulnerable rate-limit key.
- Secure OTP endpoint keeps the limit tied to the protected account.
- `/health` returns `ok`.
- `/traces` returns recent OTP attempts.

Check API Excessive Data Exposure lab:

- Home page loads.
- `/api/profile?token=student-token` returns a profile with sensitive fields.
- `/secure/api/profile?token=student-token` returns only public profile fields.
- Vulnerable response contains the flag.
- Secure response does not expose server-only fields.
- `/health` returns `ok`.
- `/traces` returns recent profile API attempts.

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

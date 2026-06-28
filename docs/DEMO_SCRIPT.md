# VulnMentor Demo Script

Use this as a guide for a live college presentation, LinkedIn demo video, or GitHub project walkthrough.

## 1. Opening

Introduce VulnMentor in one sentence:

> VulnMentor is a local-first Web and API security CTF platform where students learn vulnerabilities through hands-on labs, flags, traces, secure-code comparison, and guarded mentor guidance.

Mention the safety model:

- The portal runs locally.
- Vulnerable targets run inside Docker.
- Labs are intentionally insecure and must not be deployed publicly.

## 2. Architecture Walkthrough

Show:

- Next.js portal on `http://localhost:3000`
- Docker labs on ports `4010` to `4060`
- Health and trace endpoints
- Local browser progress
- Offline guarded AI Mentor
- Report tab export

Suggested line:

> I separated the safe learning portal from the vulnerable lab containers. This keeps the project useful for students while reducing public exposure risk.

## 3. Learning Workflow Demo

Open the portal and select one lab.

Recommended first demo:

- `Login Bypass With SQL Injection` for a beginner-friendly web security flow
- `Broken API Authorization` for a strong API security flow
- `Stored XSS In Comments` for web + secure rendering comparison

Show:

1. Brief tab
2. Start lab command
3. Open Lab button
4. Attack tab traces
5. Flag submission
6. Root Cause tab
7. Defense tab

## 4. AI Mentor Demo

Show the mentor panel:

- Ask for a progressive hint
- Ask for OWASP mapping
- Ask for defense checklist
- Try a real-target style request and show refusal behavior

Suggested line:

> The mentor is currently offline and rule-based, which makes it reliable for demos. The important part is that the guardrails are already designed before connecting any hosted LLM.

## 5. Admin And Reporting Demo

Open the Report tab.

Show:

- Labs solved
- Points earned
- Attempt logs
- Per-lab status table
- JSON/CSV export
- Challenge authoring format

Suggested line:

> This report view is the starting point for future multi-student class mode and backend-backed admin reporting.

## 6. Closing

End with the project value:

- Practical cybersecurity learning
- OWASP-aligned Web and API labs
- Offensive + defensive explanation
- Safe local sandboxing
- Portfolio-ready GitHub project

Suggested closing:

> This project shows not only how vulnerabilities work, but also how to detect, explain, fix, and safely teach them.

## Recording Checklist

- Start Docker Desktop before recording.
- Run `docker compose up --build -d`.
- Run `npm run dev`.
- Use `127.0.0.1` if `localhost` is slow.
- Keep the terminal clean and zoom browser text if presenting in class.
- Do not show real websites, private accounts, or unrelated browser tabs.
- Keep demo focused on one or two labs rather than rushing through all labs.

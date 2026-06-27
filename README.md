# VulnMentor

VulnMentor is an AI-guided Web and API security CTF sandbox for students. The goal is to help learners practice vulnerabilities safely, capture flags, understand root causes, compare vulnerable and secure code, and learn defensive thinking through logs and mitigation notes.

This repository is intentionally educational. Labs must run only in the controlled local sandbox.

## Current Build

- Next.js learning portal
- Docker-based SQL Injection login lab
- Docker-based API Broken Authorization / IDOR lab
- Lab health check from the portal
- Runtime trace view from the lab
- Flag submission workflow
- Local progress and attempt history
- Progressive hints
- Root-cause explanation
- Vulnerable vs secure code comparison
- Mitigation checklist

## Architecture

```text
Learner Browser
    |
    | http://localhost:3000
    v
VulnMentor Portal
    |
    | checks health/traces
    v
Docker Labs on 127.0.0.1:4010 and 127.0.0.1:4020
```

For now, both the portal and the lab are designed to run locally on the learner's laptop. Later, the portal can be hosted, but the vulnerable labs should still run locally or inside a controlled cyber range/VM.

## Run The Portal

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Run The Labs

Install Docker Desktop, then run:

```bash
docker compose up --build -d
```

Open the labs directly:

```text
http://127.0.0.1:4010
http://127.0.0.1:4020
```

Health endpoints:

```text
http://127.0.0.1:4010/health
http://127.0.0.1:4020/health
```

Trace endpoints:

```text
http://127.0.0.1:4010/traces
http://127.0.0.1:4020/traces
```

Current demo flags:

```text
VM{sql_auth_bypass}
VM{api_bola_idor_mastered}
```

## Safe Usage Rules

- Attack only the labs in this repository.
- Do not test payloads against real websites or third-party APIs.
- Do not deploy vulnerable labs publicly without network restrictions.
- Keep flags, secrets, and API keys out of the frontend.
- Use this project for learning, college demonstration, and controlled practice.

More details: [SAFETY.md](./SAFETY.md)

## Project Roadmap

The build plan is tracked in [ROADMAP.md](./ROADMAP.md).

## Documentation

- [Safety and ethics](./SAFETY.md)
- [Deployment model](./docs/DEPLOYMENT_MODEL.md)
- [Testing guide](./docs/TESTING_GUIDE.md)
- [Roadmap](./ROADMAP.md)

## Scripts

```bash
npm run lint
npm run build
```

## Tech Stack

- Frontend: Next.js, React, TypeScript
- UI: Tailwind CSS, lucide-react icons
- Labs: Docker Compose
- Lab runtimes: Python HTTP servers, SQLite for SQLi lab, in-memory API records for BOLA lab

Planned additions:

- Backend persistence for users and progress
- More Web/API labs such as JWT tampering, rate limit bypass, excessive data exposure, and XSS
- AI Mentor integration with hint guardrails
- Admin dashboard
- Final demo and deployment guide

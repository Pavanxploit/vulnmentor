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

The first account registered in a fresh local `.data` database becomes an instructor. Later instructor accounts require `VULNMENTOR_INSTRUCTOR_CODE`.

## Current Scope

The console is a presentation-ready catalog and review dashboard. Challenge editing is intentionally code-controlled in this phase so lab definitions stay versioned through Git.

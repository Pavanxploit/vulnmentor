# Real User Platform Plan

VulnMentor can support real students, but the safe architecture must separate the public learning portal from the intentionally vulnerable lab targets.

## Recommended Architecture

```text
Public hosted portal
    |
    | login, lessons, progress, reports
    v
VulnMentor Web App

Student laptop or private cyber range
    |
    | Docker Compose
    v
Local vulnerable labs on 127.0.0.1
```

## What Can Be Hosted Publicly

- Homepage
- Login and registration
- Teaching lessons
- Roadmap
- Dashboard
- Progress pages
- Notes
- Evidence notebooks
- Report generator
- Instructor analytics

## What Should Stay Local Or Private

- SQL Injection target
- Stored XSS target
- API authorization target
- JWT tampering target
- Rate-limit bypass target
- Excessive data exposure target
- Any intentionally vulnerable service

## Student Flow

1. Create an account in the portal.
2. Study the lesson and roadmap step.
3. Start Docker labs locally.
4. Open the lab target on `127.0.0.1`.
5. Use hints only when needed.
6. Capture the flag from the local lab.
7. Submit the flag in the portal.
8. Save evidence.
9. Compare vulnerable and secure code.
10. Generate a report.

## Instructor Flow

1. Sign in as instructor.
2. Open Guide Console.
3. Review lab readiness and metadata.
4. Check student completion, attempts, quiz scores, failed labs, and hint usage.
5. Export CSV or JSON progress reports for classroom review.

## Hosting Decision

For a college project demo, the best practical setup is:

- Portal on local `localhost:3000` or hosted frontend.
- Docker labs on each learner laptop.
- Instructor uses local demo data or a database-backed hosted version.

For real production classroom use:

- Use PostgreSQL or Supabase for users and progress.
- Keep vulnerable labs in a private VPN, cloud cyber range, or student-local Docker.
- Add stronger email verification, password reset, audit logs, and rate limiting.

## Safety Rule

Never expose intentionally vulnerable lab services directly to the public internet without strong network isolation, authentication, monitoring, and legal approval.

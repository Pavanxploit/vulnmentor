# Final Presentation Checklist

Use this checklist before presenting VulnMentor in a college review, guide meeting, LinkedIn demo, or internship interview.

## Before Presentation

- Start Docker Desktop.
- Run `docker compose up --build -d`.
- Run `npm run dev`.
- Open the portal at `http://localhost:3000`.
- Check that lab health indicators are active.
- Keep only project-related tabs open.
- Prepare one beginner lab and one API lab for demo.
- Keep the README, architecture document, and roadmap open.

## Recommended Demo Flow

1. Introduce the problem: students need safe hands-on Web and API security practice.
2. Explain the solution: VulnMentor gives local Docker labs, flags, traces, hints, secure comparison, and reports.
3. Show the architecture: safe portal on `localhost:3000`, vulnerable labs on ports `4010` to `4060`.
4. Open one lab and explain the vulnerability goal.
5. Show hints, traces, and flag submission.
6. Show root cause and defense guidance.
7. Open the AI Mentor and demonstrate safe lab-only guidance.
8. Open the Report tab and export demo data.
9. Close with future scope: authentication, database progress, multi-student class mode, and hosted safe portal.

## Best Labs To Present

| Demo Goal | Recommended Lab |
| --- | --- |
| Easy beginner impact | SQL Injection Login Lab |
| Strong API security discussion | Broken Object Level Authorization |
| Web security plus defense | Stored XSS Comment Lab |
| Authentication topic | JWT Tampering Lab |
| Business logic and abuse control | Rate Limit Bypass Lab |

## What To Say To The Guide

- The project is safe because vulnerable targets run locally in Docker.
- The project is not only exploitation-focused; it also teaches detection, explanation, mitigation, and secure comparison.
- The mentor is currently offline and guarded, so it is safe for college demo use.
- The architecture can later support user login, database-backed progress, and class-level reporting.

## Do Not Do

- Do not test payloads on real websites.
- Do not show flags directly from source files during the demo.
- Do not expose the vulnerable lab containers publicly.
- Do not rush through every lab; explain one or two labs clearly.
- Do not present the mentor as a real hosted LLM until that integration is added.

## Final GitHub Check

- README explains the project clearly.
- Safety rules are visible.
- Roadmap shows completed and pending phases.
- Architecture diagram is available.
- Demo script is available.
- No public answer sheet is included in the README.
- Build and lint pass before pushing.

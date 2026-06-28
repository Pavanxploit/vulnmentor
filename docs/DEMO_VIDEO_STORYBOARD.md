# VulnMentor Demo Video Storyboard

Use this storyboard to record a clean 4 to 6 minute demo for college review, GitHub, LinkedIn, or internship applications.

## Recording Setup

Open only these windows:

- Browser with VulnMentor portal
- Terminal in the project folder
- Docker Desktop only if needed for proof

Run:

```bash
docker compose up --build -d
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## Video Flow

| Time | Screen | What To Show | What To Say |
| --- | --- | --- | --- |
| 0:00-0:30 | Homepage | Hero section and learning modules | VulnMentor is a local-first Web and API security CTF platform for students. |
| 0:30-1:10 | Dashboard | Progress, lab cards, sidebar | Students can choose labs, track progress, and continue learning from one dashboard. |
| 1:10-2:20 | SQLi lab page | Scenario, target URL, hints, submit flag | Each lab has objective, hints, local Docker target, and flag validation. |
| 2:20-3:00 | Secure comparison | Vulnerable vs secure code section | The project teaches defense by comparing the risky code with the fixed implementation. |
| 3:00-3:45 | Admin console | `/admin` readiness board | Guides can review lab readiness, verifier IDs, Docker ports, and authoring coverage. |
| 3:45-4:30 | Traces/reporting | Activity, attempts, export/reporting | Students learn detection thinking through traces and progress reports. |
| 4:30-5:15 | Docs/GitHub | README, safety rules, roadmap | The project is documented for safe usage, college review, and future development. |
| 5:15-5:45 | Closing | Roadmap or dashboard | Future scope includes hosted safe frontend, class mode, and more lab templates. |

## Suggested Opening Script

VulnMentor is a safe Web and API security learning platform where students solve vulnerable labs, capture flags, review traces, and compare vulnerable code with secure fixes. The platform is designed for beginner-friendly cybersecurity practice while keeping intentionally vulnerable targets inside local Docker containers.

## Suggested Closing Script

This project is not only about exploiting vulnerabilities. It also teaches root cause, detection, mitigation, secure coding, reporting, and safe lab isolation. That makes VulnMentor useful as a major project, a student learning tool, and a cybersecurity portfolio project.

## Recording Tips

- Keep browser zoom at 90% or 100%.
- Use one Web lab and one API lab if you want a longer demo.
- Do not reveal real flags in public videos.
- Do not open unrelated websites or private accounts.
- Keep the terminal commands simple and readable.
- Mention that vulnerable labs should not be hosted publicly without restrictions.

## Short 90-Second Version

1. Show homepage and explain the project in one sentence.
2. Show dashboard and lab list.
3. Open SQL Injection or BOLA lab.
4. Show hints, submit flag area, traces, and secure comparison.
5. Show Admin Console.
6. End with roadmap and safety model.

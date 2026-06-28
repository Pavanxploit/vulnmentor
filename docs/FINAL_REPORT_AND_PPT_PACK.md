# Final Report And PPT Content Pack

Use this as the source material for the final report, milestone presentation, and viva explanation.

## Recommended Project Title

VulnMentor: An AI-Guided Web and API Security CTF Sandbox for Safe Cybersecurity Learning

## Abstract

VulnMentor is a local-first cybersecurity learning platform designed to help students understand Web and API vulnerabilities through practical CTF-style labs. The platform combines Docker-based vulnerable environments, flag submission, progressive hints, runtime traces, secure-code comparison, guarded mentor guidance, student progress tracking, and an admin challenge management console. The project focuses on safe learning by keeping vulnerable services on localhost while explaining the attack flow, root cause, detection indicators, impact, and mitigation for each lab. The current implementation includes SQL Injection, Stored XSS, Broken Object Level Authorization, JWT tampering, OTP rate-limit bypass, and excessive data exposure labs mapped to OWASP concepts.

## Problem Statement

Students often learn cybersecurity concepts theoretically, but they may not get enough safe, guided, hands-on practice with realistic Web and API vulnerabilities. Public testing is unsafe and unethical, while many existing labs focus mainly on exploitation without clearly teaching defense, logging, secure coding, and structured learning progress.

## Objectives

- Build a safe local platform for Web and API vulnerability practice.
- Provide CTF-style labs with flags, hints, and learning objectives.
- Include both vulnerable and secure implementations for comparison.
- Show traces and logs so students understand detection signals.
- Track student progress and flag attempts.
- Provide a guide/admin view for challenge readiness and lab review.
- Keep the platform suitable for college demonstrations and portfolio use.

## Scope

The current scope includes a local Next.js learning portal and Docker-based vulnerable labs. The portal can later be hosted as a safe frontend, but vulnerable targets should remain local, private, or restricted to a controlled cyber range.

## Methodology

1. Identify common Web and API vulnerabilities from OWASP categories.
2. Build intentionally vulnerable local lab targets in Docker.
3. Add secure versions to demonstrate mitigation.
4. Connect each lab to the portal with scenario, hints, target URL, traces, and flag submission.
5. Store student progress and attempts for demo reporting.
6. Add guide/admin review screens for lab management and evaluation.
7. Document safety rules, architecture, testing steps, and future scope.

## Modules

| Module | Description |
| --- | --- |
| Learning Portal | Next.js frontend for dashboard, labs, hints, flags, and explanations |
| Docker Lab Sandbox | Local vulnerable targets isolated from public deployment |
| Flag Verification | Server-side flag validation without exposing flags in README |
| Progress Tracking | Local/backend demo progress and attempt history |
| Secure Comparison | Vulnerable vs secure code on each lab page |
| Runtime Traces | Lab activity logs for defender-style learning |
| AI Mentor Guardrails | Lab-only guidance and refusal behavior for real-world targets |
| Admin Console | Challenge readiness, verifier IDs, Docker service review, and authoring snapshot |

## Implemented Labs

| Lab | Category | Vulnerability Concept |
| --- | --- | --- |
| Login Bypass With SQL Injection | Web Security | Unsafe SQL query construction |
| Stored XSS In Comments | Web Security | Stored input rendered without output encoding |
| Broken API Authorization | API Security | Broken Object Level Authorization / IDOR |
| JWT Role Tampering | API Security | Trusting unverified JWT claims |
| OTP Rate Limit Bypass | API Security | Client-controlled rate-limit key |
| Excessive Data Exposure | API Security | Returning sensitive server-side fields |

## Technology Stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- Icons: lucide-react
- Labs: Docker Compose
- Lab runtimes: Python HTTP servers
- Storage: Local JSON demo database and browser fallback progress
- Documentation: Markdown project docs and screenshots

## PPT Slide Outline

| Slide | Title | Key Points |
| --- | --- | --- |
| 1 | Title | Project title, team members, guide, department, college |
| 2 | Introduction | Why safe Web/API security learning is needed |
| 3 | Problem Statement | Lack of guided hands-on labs with defense learning |
| 4 | Objectives | Safe labs, flags, hints, traces, secure comparison, progress |
| 5 | Literature Survey | CTF learning, portable CTF labs, LLM tutors, OWASP/API references |
| 6 | Existing System | General CTF platforms and vulnerable apps |
| 7 | Proposed System | VulnMentor learning platform and Docker sandbox |
| 8 | Architecture | Portal, Docker labs, health/traces, flag verification |
| 9 | Modules | Dashboard, labs, mentor, reports, admin console |
| 10 | Implemented Labs | SQLi, XSS, BOLA, JWT, rate limit, data exposure |
| 11 | Unique Features | Secure comparison, traces, safe mentor, admin readiness board |
| 12 | Screenshots | Homepage, dashboard, lab page, admin console |
| 13 | Results | Working labs, progress tracking, reports, verified build |
| 14 | Safety And Ethics | Localhost-only vulnerable targets and safe usage rules |
| 15 | Future Scope | Hosted frontend, class mode, template generator, more labs |
| 16 | Conclusion | Practical, safe, defense-aware cybersecurity learning platform |

## Viva Talking Points

- The vulnerable targets run locally in Docker and should not be publicly exposed.
- The portal can be hosted safely because it is separate from the vulnerable services.
- Each lab teaches attack, trace/detection, root cause, and secure fix.
- The admin console helps guides review lab readiness before a class or demo.
- The mentor is guarded and currently lab-focused to avoid helping with real-world targets.
- The project is useful for AppSec, SOC, bug bounty preparation, and cybersecurity education.

## Expected Questions And Answers

| Question | Strong Answer |
| --- | --- |
| Why Web plus API labs? | Modern applications depend heavily on APIs, so Web and API security together give better real-world learning. |
| Why Docker? | Docker makes labs repeatable, isolated, and easy to reset on a student laptop. |
| Why not host vulnerable labs publicly? | Public vulnerable labs can be abused. The safe model is local Docker, private network, or restricted cyber range. |
| What makes it unique? | It combines CTF flags, traces, secure-code comparison, mentor guardrails, progress reports, and admin readiness review. |
| How does it help students? | Students learn practical exploitation and also understand root cause, impact, mitigation, and detection. |
| What is the future scope? | Hosted safe frontend, multi-student class mode, database-backed reporting, more labs, and lab template generator. |

## Final Report Section Order

1. Abstract
2. Introduction
3. Problem Statement
4. Objectives
5. Literature Survey
6. Existing System
7. Proposed System
8. System Architecture
9. Methodology
10. Module Description
11. Implementation
12. Testing And Results
13. Safety And Ethics
14. Applications
15. Future Scope
16. Conclusion
17. References

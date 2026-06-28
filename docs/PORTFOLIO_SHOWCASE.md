# Portfolio Showcase Notes

This document explains how to present VulnMentor as a major project, GitHub portfolio project, or internship interview discussion.

## Short Project Pitch

VulnMentor is an AI-guided Web and API security CTF sandbox for students. It provides Dockerized vulnerable labs, secure comparison paths, flag validation, traces, progressive hints, guarded mentor guidance, and progress reports.

## What Makes It Different

- Combines Web and API security instead of focusing on only one area
- Includes vulnerable and secure versions for learning defense, not just exploitation
- Uses Docker to keep labs isolated on localhost
- Shows runtime traces so students understand detection and logging
- Includes a guarded mentor design that refuses real-target abuse
- Provides report export for presentation and future classroom use

## Skills Demonstrated

- Web security fundamentals
- API security and OWASP API Top 10 concepts
- Docker-based lab isolation
- Next.js and TypeScript frontend development
- Secure coding explanation
- Flag verification workflow
- Local progress tracking
- Cybersecurity teaching platform design
- Safety and ethics documentation

## Resume Project Bullet

Built VulnMentor, a Dockerized Web and API security CTF learning platform with SQLi, Stored XSS, BOLA, JWT tampering, rate-limit bypass, and excessive-data-exposure labs, including flag verification, runtime traces, secure-code comparison, guarded mentor guidance, and exportable student progress reports.

## Interview Talking Points

1. Why local Docker labs are safer than public vulnerable hosting.
2. How each vulnerability maps to OWASP Web/API categories.
3. How the portal verifies flags and stores local progress.
4. Why the mentor refuses real-world target requests.
5. How traces help students think like defenders, not only attackers.
6. How this can evolve into multi-student class mode.

## Guide Presentation Angle

Explain the project as a learning ecosystem:

- Attack: student exploits the lab
- Detect: traces show suspicious behavior
- Understand: root cause explains the bug
- Defend: secure code and mitigation checklist show the fix
- Report: progress dashboard summarizes learning

## GitHub Readiness Checklist

- README explains safe local usage
- Safety rules are visible
- Docker setup is one command
- Labs have health endpoints
- No real secrets or real targets are included
- Demo script is available
- Architecture diagram is documented
- Roadmap shows completed and future phases

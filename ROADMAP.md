# VulnMentor Roadmap

This roadmap tracks the step-by-step build plan for the major project.

## Phase 1: Foundation

Status: complete

- [x] Create Next.js learning portal
- [x] Add first Docker-based SQL Injection lab
- [x] Add flag submission workflow
- [x] Add hints, root-cause notes, secure code, and mitigation checklist
- [x] Create GitHub repository
- [x] Add safety documentation
- [x] Add deployment model documentation
- [x] Add testing guide
- [x] Connect lab health and runtime traces in the portal
- [x] Add polished project screenshots

## Phase 2: Real Learning Workflow

- [x] Add student access flow
- [x] Add server-side flag verification endpoint
- [x] Store early prototype browser progress
- [x] Store backend-backed progress in local JSON database
- [x] Store local flag attempt history
- [x] Add lab completion states
- [x] Add challenge filtering by category and difficulty
- [x] Add lab reset instructions
- [x] Move protected progress from browser storage to account-backed local database

## Phase 3: More Web And API Labs

- [x] IDOR / Broken Object Level Authorization
- [x] JWT tampering
- [x] Rate limit bypass
- [x] Excessive data exposure
- [x] Stored XSS
- [x] Secure version comparison for API BOLA lab
- [x] Secure version comparison for every vulnerable lab

## Phase 4: AI Mentor

- [x] Add AI Mentor prompt guardrails
- [x] Add hint levels
- [x] Add post-solve explanation
- [x] Add OWASP mapping per lab
- [x] Add refusal behavior for real-world targets

## Phase 5: Guide Console And Reporting

- [x] Instructor guide console
- [x] Lab authoring format
- [x] Student progress report
- [x] Attempt logs dashboard
- [x] Exportable project demo data

## Phase 6: Portfolio Polish

- [x] Public-safe README
- [x] Demo script
- [x] Demo video storyboard
- [ ] Recorded demo video
- [x] Screenshots
- [x] Screenshot capture script
- [x] Architecture diagram
- [x] Portfolio showcase notes
- [x] Final presentation checklist
- [x] Final report and PPT content pack
- [ ] Final report and PPT files
- [ ] Optional hosted frontend

## Phase 7: Academy Website Experience

- [x] Mark current working project with a backup Git tag
- [x] Create original dark cybersecurity homepage
- [x] Add dashboard with left sidebar, learning paths, labs, progress, notes, and settings sections
- [x] Add dynamic lab detail pages with scenario, target URL, hints, flag submission, and post-completion explanation
- [x] Refresh screenshots for the new academy UI

## Phase 8: Student Login And Backend Progress

- [x] Add HTTP-only session cookie login
- [x] Add backend session API
- [x] Add local JSON progress database under `.data`
- [x] Save signed-in student flag attempts through the backend
- [x] Keep legacy browser progress fallback for local prototypes
- [x] Add dashboard student access panel

## Phase 9: Secure Comparison Completion

- [x] Add vulnerable vs secure implementation section to every lab page
- [x] Show risky code and fixed code side by side
- [x] Add per-lab secure coding checklist from mitigation notes
- [x] Update lab checklist to include secure-code comparison

## Phase 10: Real User Access Hardening

- [x] Add email/password registration and login pages
- [x] Hash account passwords with per-user salts
- [x] Store sessions in HTTP-only cookies
- [x] Add student and instructor roles
- [x] Protect dashboard, labs, flag submission, and guide console routes
- [x] Rename public management wording to Guide Console / Instructor Console
- [x] Remove plaintext flags from the portal verifier and compare hashed values
- [x] Add homepage "How it works" section for beginners

## Phase 11: Real Platform Upgrade

- [x] Add visual beginner-to-advanced roadmap page
- [x] Save lesson quiz results to account progress
- [x] Save per-lab evidence notebooks
- [x] Add per-lab Markdown, JSON, and CSV report generator
- [x] Track hint usage for instructor analytics
- [x] Add instructor analytics for students, attempts, failed labs, quiz scores, and hint usage
- [x] Add database migration plan for JSON, SQLite, PostgreSQL, and Supabase
- [x] Add real-user safe platform architecture documentation
- [x] Add validation script for challenge metadata, protected routes, safety checks, and required docs

## Remaining Focus Areas

These are last-phase items. Do not start them until explicitly requested.

- Record actual demo video
- Generate final report and PPT files
- Optional hosted safe frontend
- Stretch goals after the main project is review-ready

## Stretch Goals

- [ ] Challenge template generator
- [ ] Docker lab health manager
- [ ] Multi-user class mode
- [ ] Lab import/export
- [ ] CI checks for lab startup

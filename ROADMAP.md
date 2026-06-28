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

- [ ] Add user login
- [x] Add server-side flag verification endpoint
- [x] Store local browser progress for prototype demos
- [x] Store local flag attempt history
- [x] Add lab completion states
- [x] Add challenge filtering by category and difficulty
- [x] Add lab reset instructions
- [ ] Move progress from local storage to a database after authentication is added

## Phase 3: More Web And API Labs

- [x] IDOR / Broken Object Level Authorization
- [x] JWT tampering
- [x] Rate limit bypass
- [x] Excessive data exposure
- [x] Stored XSS
- [x] Secure version comparison for API BOLA lab
- [ ] Secure version for every vulnerable lab

## Phase 4: AI Mentor

- [x] Add AI Mentor prompt guardrails
- [x] Add hint levels
- [x] Add post-solve explanation
- [x] Add OWASP mapping per lab
- [x] Add refusal behavior for real-world targets

## Phase 5: Admin And Reporting

- [ ] Admin challenge management
- [x] Lab authoring format
- [x] Student progress report
- [x] Attempt logs dashboard
- [x] Exportable project demo data

## Phase 6: Portfolio Polish

- [x] Public-safe README
- [x] Demo script
- [ ] Recorded demo video
- [x] Screenshots
- [x] Screenshot capture script
- [x] Architecture diagram
- [x] Portfolio showcase notes
- [x] Final presentation checklist
- [ ] Final report and PPT updates
- [ ] Optional hosted frontend

## Phase 7: Academy Website Experience

- [x] Mark current working project with a backup Git tag
- [x] Create original dark cybersecurity homepage
- [x] Add dashboard with left sidebar, learning paths, labs, progress, notes, and settings sections
- [x] Add dynamic lab detail pages with scenario, target URL, hints, flag submission, and post-completion explanation
- [x] Refresh screenshots for the new academy UI

## Remaining Focus Areas

- Backend login and database-backed student progress
- Secure comparison coverage for every lab
- Admin challenge management
- Recorded demo video
- Final report and PPT updates
- Optional hosted safe frontend
- Stretch goals after the main project is review-ready

## Stretch Goals

- [ ] Challenge template generator
- [ ] Docker lab health manager
- [ ] Multi-user class mode
- [ ] Lab import/export
- [ ] CI checks for lab startup

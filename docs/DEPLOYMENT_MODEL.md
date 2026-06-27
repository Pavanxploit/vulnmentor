# Deployment Model

VulnMentor has two parts:

1. The learning portal
2. The vulnerable lab environment

These two parts do not have to be hosted in the same place.

## Recommended Model For College Demo

```text
Your laptop
  - Next.js portal on http://localhost:3000
  - Docker labs on http://localhost:4010, 4020, ...
```

This is the safest and simplest model for development and demonstration.

## Recommended Model For Students

```text
Student laptop
  - Runs Docker Desktop
  - Runs docker compose up --build
  - Opens portal and labs locally
```

The student receives:

- GitHub repository or release ZIP
- Docker setup instructions
- Lab guide
- Safety rules

## Hosted Portal Model

The portal can later be hosted on a platform such as Vercel, but the labs should still run locally or in a controlled VM.

```text
Hosted portal
  - Learning paths
  - Documentation
  - User progress
  - AI Mentor

Student laptop
  - Docker labs
  - Vulnerable endpoints on localhost
```

Important note: a hosted HTTPS website may have browser restrictions when trying to directly read `http://localhost` lab endpoints. For the first version, local portal plus local Docker labs is more reliable.

## Why Not Host Vulnerable Labs On Vercel?

The vulnerable labs are intentionally insecure and may need long-running container services. A frontend hosting platform is not the right place to expose intentionally vulnerable targets. Publicly hosting vulnerable endpoints can create risk for the owner and other users.

Better options for future advanced deployment:

- Local Docker on learner laptop
- College lab machines
- Private cloud VM with firewall rules
- Temporary cyber range instance
- VPN-only internal demo server

## Final Recommended Plan

For Phase 1 and Phase 2:

- Build and test everything locally.
- Keep vulnerable labs inside Docker.
- Use GitHub for code and documentation.

For final showcase:

- Host only the safe portal/demo if needed.
- Keep vulnerable labs local or private.
- Provide a demo video and screenshots.

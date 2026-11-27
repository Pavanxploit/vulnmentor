# Deployment Model

VulnMentor has two parts:

1. The learning portal
2. The vulnerable lab environment

These two parts do not have to be hosted in the same place.

## Public student demo

The published [Defender Mode demo](https://pavan-vulnmentor-demo.humbleflea128.chatgpt.site) serves only the contents of `public/demo`. To host that frontend on Vercel, import the repository and select `public/demo` as its root directory. For Netlify, the root `netlify.toml` selects the same publish directory. Guest progress lasts for the current page visit.

The full portal uses Pino request logs with an `x-request-id` response header. Set `SENTRY_DSN` to enable server error reporting. Set server-side `OPENAI_API_KEY` and optionally `VULNMENTOR_MENTOR_MODEL` for model-assisted selection of authored coaching prompts. The selector receives the lab title and activity counts. Provider errors fall back to local coaching. The limiter is per-process.

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

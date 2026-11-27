# Contributing to VulnMentor

Use Node 24 and run `npm ci`. The portal uses SQLite locally. The six case files in `public/demo/` run from any static HTTP server.

1. Pick a learner outcome and the page where a student or instructor should see it.
2. Change the smallest relevant component, route, or lesson. Use only synthetic records in fixtures and media.
3. Run `npm run lint`, `npm run validate`, `npm run test:coverage`, and `npm run build`. Regenerate the coverage badge with `node scripts/coverage-badge.mjs`.
4. Run `npx playwright install chromium` once, then `npm run test:e2e`. The suite creates test users in a temporary database.
5. Describe the learner-visible change and list the checks you ran in your pull request.

For content contributions, start with the [case authoring template](docs/templates/case.md). Describe an observation, the security rule it violates, the correction, and the evidence that would verify the correction. Place a case proposal in a new issue before investing in recordings.

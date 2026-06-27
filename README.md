# VulnMentor

VulnMentor is an AI-guided Web and API security learning sandbox. This first build includes a Next.js learning portal and one Docker-based SQL Injection lab.

## Run The Portal

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run The First Lab

```bash
docker compose up --build
```

Open `http://localhost:4010`.

The first demo flag is:

```text
VM{sql_auth_bypass}
```

## Current Stage

- Dashboard and lab selection
- SQL Injection challenge brief
- Progressive guided hints
- Flag submission
- Attack traces
- Root-cause explanation
- Vulnerable vs secure code comparison
- Mitigation checklist
- Docker sandbox for the first lab

## Next Stages

- Connect portal controls to lab health and traces
- Add user login and progress storage
- Add XSS and Broken API Authorization labs
- Add admin challenge management
- Add optional hosted AI mentor integration

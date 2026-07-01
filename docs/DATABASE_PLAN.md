# VulnMentor Database Plan

VulnMentor currently uses a local JSON database so the full platform can run on a student laptop without paid cloud services. The code is structured so the data model can later move to SQLite, PostgreSQL, or Supabase without changing the learning flow.

## Current Storage

Local file:

```text
.data/vulnmentor-progress.json
```

This file stores:

- Users
- Password hashes
- Sessions
- Completed labs
- Flag attempts
- Quiz results
- Hint views
- Evidence notebooks
- Generated report history

The `.data` directory is ignored by Git because it contains local user and progress data.

## Current Provider

Default provider:

```text
json
```

Runtime status endpoint:

```text
GET /api/system/database
```

The endpoint reports the configured provider, the active local provider, and the data models that are ready for migration.

## Production-Ready Tables

When VulnMentor moves to a hosted classroom setup, use these tables:

| Table | Purpose |
| --- | --- |
| `users` | Student and instructor accounts |
| `sessions` | Active login sessions |
| `labs` | Lab catalog metadata |
| `lessons` | Teaching lesson metadata |
| `progress` | Per-user completion summary |
| `attempts` | Flag submissions and correctness |
| `quiz_results` | Lesson assessment scores |
| `hint_views` | Hint usage analytics |
| `evidence_notebooks` | Student proof notes for each lab |
| `notes` | Student learning notes |
| `instructor_reports` | Export history and classroom reports |

## Recommended Upgrade Path

1. Keep JSON for local demos and college presentation.
2. Add SQLite for a stronger single-machine version.
3. Add PostgreSQL or Supabase for hosted classroom accounts.
4. Move file writes behind a database adapter interface.
5. Keep Docker labs local or inside a private cyber range.
6. Never host intentionally vulnerable labs on a public unrestricted URL.

## Data Privacy Rules

- Store only required student progress data.
- Never store plaintext passwords.
- Keep session cookies HTTP-only.
- Do not publish `.data` files.
- Do not store real target data inside evidence notebooks.
- Export instructor reports only for authorized class/demo use.

# VulnMentor Database Plan

VulnMentor runs on SQLite by default and keeps the original JSON file store as a
working fallback. Both are local files, so the full platform still runs on a
student laptop with no paid cloud services.

Storage sits behind an adapter interface, so the rest of the application never
learns which engine is active.

```text
src/lib/progress-store.ts        facade — selects the adapter, public API
src/lib/store/store-shared.ts    shared types, auth rules, analytics
src/lib/store/sqlite-store.ts    SQLite adapter (default)
src/lib/store/json-store.ts      JSON adapter (fallback)
src/lib/store/schema.sql         schema, shared with the migration script
```

## Choosing A Provider

| Value | Behaviour |
| --- | --- |
| unset (default) | SQLite at `.data/vulnmentor.sqlite` |
| `VULNMENTOR_DATABASE_PROVIDER=sqlite` | Same as the default |
| `VULNMENTOR_DATABASE_PROVIDER=json` | The original `.data/vulnmentor-progress.json` store |

```bash
VULNMENTOR_DATABASE_PROVIDER=json npm run dev
```

If accounts exist in the JSON file but no SQLite database has been created yet,
the app refuses to start rather than serving an empty database, and prints the
migration command. Silently showing zero progress is indistinguishable from
total data loss to an instructor mid-class.

Runtime status endpoint:

```text
GET /api/system/database
```

## Running The Migration

The migration reads the JSON file and never modifies it.

```bash
npm run migrate:sqlite -- --dry-run   # report what would move, write nothing
npm run migrate:sqlite                # migrate, then verify
npm run migrate:verify                # re-verify an existing migration
npm run migrate:sqlite -- --force     # rebuild SQLite from JSON
```

A timestamped snapshot is written to `.data/backups/pre-sqlite-migration-*.json`
before anything is created.

### Verifying Data Integrity

`npm run migrate:sqlite` verifies automatically, and `npm run migrate:verify`
re-runs the same checks at any time:

- row counts per table against the JSON source
- every user's email, name, role, password hash, and creation time
- every evidence notebook's long-text fields, where truncation would show first
- record ordering, confirming the oldest attempt holds the lowest rowid

To inspect the result by hand:

```bash
node -e "const d=require('better-sqlite3');const db=new d('.data/vulnmentor.sqlite',{readonly:true});console.log(db.pragma('integrity_check'), db.prepare('SELECT COUNT(*) n FROM users').get())"
```

Progress records belonging to deleted accounts cannot be migrated — there is no
user row to attach them to. The migration reports them individually and leaves
them in the JSON file and the snapshot.

## Schema

Progress used to live in one JSON blob per user. It is normalised so instructor
analytics can use indexes instead of scanning every record.

| Table | Purpose |
| --- | --- |
| `users` | Student and instructor accounts, password hashes |
| `sessions` | Active login sessions |
| `completed_labs` | Solved labs, in solve order |
| `attempts` | Flag submissions and correctness |
| `quiz_results` | Lesson scores, one row per lesson per student |
| `hint_views` | Hint usage analytics |
| `evidence_notebooks` | Student proof notes, one row per lab per student |
| `reports` | Export history |
| `classes` | Cohorts and batches, with join code and active/archived status |
| `class_enrollments` | Which students belong to which class |
| `schema_meta` | Migration bookkeeping |

Classes were added after the SQLite migration. Both tables are declared with
`CREATE TABLE IF NOT EXISTS`, so an existing database gains them on next start
with no migration step and no change to any existing table.

`class_enrollments` is a pure join table. Its composite primary key
`(class_id, user_id)` is what prevents a student joining the same class twice,
and because it holds no progress, removing a student from a class deletes one
row and cannot affect their account or results. Both foreign keys cascade, so
deleting a class or a user cleans up enrolments automatically.

Class features require SQLite. Under `VULNMENTOR_DATABASE_PROVIDER=json` the
class routes return `501` with an explanatory message rather than duplicating
relational joins into the flat file.

Lab and lesson metadata stay in `src/data/` as code, not rows: they are authored
content, versioned with the repository.

### Indexes

Indexes follow the queries the app actually runs — loading one student's
progress newest-first, and aggregating per challenge across students.

```text
idx_sessions_user_id, idx_sessions_expires_at      session cascade and expiry pruning
idx_attempts_user_time, idx_quiz_results_user,
idx_hint_views_user, idx_evidence_user,
idx_reports_user                                    per-student progress reads
idx_attempts_challenge, idx_hint_views_challenge    per-challenge analytics
idx_users_role                                      roster filtering
idx_classes_instructor                              an instructor's active classes
idx_class_enrollments_user                          a student's "My Classes"
```

## Behaviour Differences

| | JSON | SQLite |
| --- | --- | --- |
| Concurrent writes | Serialized by an in-process promise queue | Transactions plus WAL, which also holds across processes |
| Retention | Older records were discarded past a cap | All rows kept; the same caps applied at read time |
| Backups | Full file copy every 15 min, newest 20 kept | SQLite online backup on the same schedule |

Retention is the one place SQLite keeps strictly more: the JSON store dropped a
student's oldest attempts once they passed 100. Reads still return the same
capped, newest-first list, so the API is unchanged.

## PostgreSQL

Use a dedicated PostgreSQL database and set `DATABASE_URL` in the server environment. Keep `VULNMENTOR_DATABASE_PROVIDER=sqlite` while the original installation is serving students.

For a fresh database, run `npm run migrate:postgres -- --init`. To migrate existing SQLite records, pause classroom writes, run `npm run migrate:postgres`, then `npm run migrate:postgres -- --verify`. The importer opens the SQLite source read-only, copies in dependency order, and compares the fields in every copied row before committing. A conflict rolls back the transaction. Set `VULNMENTOR_DATA_DIR` to select an alternate SQLite directory.

After verification, start the portal with `VULNMENTOR_DATABASE_PROVIDER=postgres` and the same `DATABASE_URL`. PostgreSQL stores portal accounts, sessions, progress, classroom data and authored lessons. The database operator owns PostgreSQL backups. Keep the SQLite copy at the cutover point. Returning to it after new PostgreSQL writes requires reconciling those writes.

## Remaining Upgrade Path

1. SQLite for single-machine classroom use — done.
2. PostgreSQL for hosted classroom accounts — implemented.
3. Move rate limiting out of process memory when the app runs multiple workers.
4. Keep Docker labs local or inside a private cyber range.
5. Never host intentionally vulnerable labs on a public unrestricted URL.

## Data Privacy Rules

- Store only required student progress data.
- Never store plaintext passwords.
- Keep session cookies HTTP-only.
- Do not publish `.data` files.
- Do not store real target data inside evidence notebooks.
- Export instructor reports only for authorized class/demo use.

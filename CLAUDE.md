# CLAUDE.md

This project follows a single set of agent guidelines. See **[AGENTS.md](./AGENTS.md)**
for the full details on architecture, safety principles, development commands,
and — importantly — the **required Conventional Commits** message format that
drives automated releases.

Key reminders:

- **Safety first:** `declarativeNetRequest` only, no network calls, no
  telemetry, minimal permissions.
- **Verify:** run `pnpm compile` and `pnpm build` before finishing changes.
- **Commits:** every commit must be a [Conventional Commit](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, etc.). Non-conforming messages produce no release.

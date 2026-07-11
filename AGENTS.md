# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

**Open ModHeader** is an open-source, auditable browser extension to modify HTTP
request and response headers — a clean-by-design alternative to ModHeader.

- **Stack:** WXT + React 19, Chrome MV3, TypeScript, pnpm, plain CSS.

## Safety principles (non-negotiable — core to project identity)

- **`declarativeNetRequest` only.** The browser applies header rules; the
  extension must never read, log, or exfiltrate traffic. Never introduce
  `webRequest` or any traffic-reading API.
- **No network calls.** Zero outbound requests — no analytics, telemetry, or
  remote config.
- **No header history.** Persist nothing except the user's own rules.
- **Minimal permissions:** only `declarativeNetRequest` and `storage`, plus the
  `<all_urls>` host permission required to apply rules. Adding a permission
  requires strong justification.

## Architecture

- `entrypoints/background.ts` — loads state, syncs dynamic rules on change.
- `entrypoints/popup/` — React popup UI (`App.tsx`, `style.css`).
- `lib/types.ts` — data model: `AppState { globalEnabled, activeProfileId,
  profiles[] }`, `Profile { id, name, rules[] }`, `HeaderRule { id, enabled,
  target(request|response), op(set|remove), name, value }`.
- `lib/storage.ts` — load/save state + change events, legacy migration.
- `lib/dnr.ts` — `stateToDnrRules(state)` → dynamic rules for the active profile.
- `lib/modheader.ts` — ModHeader-compatible import/export.
- `lib/presets.ts` — built-in presets (e.g. CORS bypass).

## Development

```sh
pnpm install
pnpm dev        # run in Chrome
pnpm compile    # typecheck (tsc --noEmit)
pnpm build      # production build
pnpm zip        # package Chrome extension into .output/
```

Before finishing any change, ensure both pass:

```sh
pnpm compile
pnpm build
```

## Commit conventions (REQUIRED)

This repository uses **[Conventional Commits](https://www.conventionalcommits.org/)**.
Commit messages drive automated versioning and releases via semantic-release, so
the format is mandatory. **A non-conforming message produces no release.**

Format:

```
<type>(<optional scope>): <description>
```

| Type       | Purpose                                  | Release effect     |
| ---------- | ---------------------------------------- | ------------------ |
| `feat`     | New feature                              | Minor (`1.1.0`)    |
| `fix`      | Bug fix                                  | Patch (`1.0.1`)    |
| `docs`     | Documentation only                       | None               |
| `style`    | Formatting, no code-behavior change      | None               |
| `refactor` | Code change that isn't a feat or fix     | None               |
| `perf`     | Performance improvement                  | Patch              |
| `test`     | Adding or fixing tests                   | None               |
| `build`    | Build system or dependencies             | None               |
| `ci`       | CI configuration                         | None               |
| `chore`    | Other maintenance                        | None               |

**Breaking changes** → major release: append `!` after the type
(`feat!: ...`) or add a `BREAKING CHANGE:` footer.

Examples:

```
feat: add one-click CORS preset
fix: preserve rule order after profile rename
feat(popup): support duplicating profiles
docs: clarify permission model in README
```

Rules for agents when committing:

- **Always** use a Conventional Commit message. Never write freeform subjects
  like "updated stuff" or "fixes".
- Keep the subject in the imperative mood, lowercase, ≤ 72 chars, no trailing
  period.
- Use the body to explain **why**, not what, when it isn't obvious.
- If the repo uses squash merges, the **PR title** must also be a Conventional
  Commit, since it becomes the commit on `main`.

## Releases

Releases are fully automated. On merge to `main`, semantic-release analyzes the
commits, bumps the version, updates `CHANGELOG.md`, and publishes a GitHub
Release with the Chrome zip attached. Never bump the version or tag manually.

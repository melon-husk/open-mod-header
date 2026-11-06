# Contributing to Open ModHeader

Thanks for your interest in improving Open ModHeader! This project is built to
be **safe by design** — minimal permissions, no network calls, no telemetry.
Please keep that principle in mind for every change.

## Project principles

These are non-negotiable and define the identity of the project:

- **`declarativeNetRequest` only.** The browser applies header rules; the
  extension must never read, log, or exfiltrate traffic. Do not add
  `webRequest` or any traffic-reading APIs.
- **No network calls.** Zero outbound requests — no analytics, no remote
  config, no telemetry.
- **No header history.** Nothing is persisted except the user's own rules.
- **Minimal permissions.** Only `declarativeNetRequest` and `storage`, plus the
  `<all_urls>` host permission required to apply rules. Adding a permission
  needs a strong justification in the PR.

## Getting started

Requirements: [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) 10+.

```sh
pnpm install
pnpm dev          # run in Chrome (WXT dev server)
pnpm dev:firefox  # run in Firefox
```

## Development workflow

```sh
pnpm compile   # typecheck (tsc --noEmit)
pnpm lint:a11y # static accessibility linting (eslint)
pnpm build     # production build
pnpm zip       # package the Chrome extension into .output/
```

Before opening a pull request, make sure all of these pass:

```sh
pnpm compile
pnpm lint:a11y
pnpm build
```

## Accessibility Standards (WCAG 2.1 AA)

All user interface components in Open ModHeader must strictly conform to WCAG 2.1 Level AA accessibility standards.

### Core Guidelines
- **Color Contrast:** Text and interactive elements must maintain a contrast ratio of at least 4.5:1 against their backgrounds (3:1 for large text and UI components/badges).
- **Keyboard Navigation:** All interactive elements must be focusable and operable using keyboard controls (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`, arrow keys).
- **Focus Indicators:** Focus rings (`:focus-visible`) must be visible for keyboard users.
- **Accessible Names:** Form controls, input rows, selects, and icon buttons must expose explicit accessible names via `<label>`, `aria-label`, or `aria-labelledby`. Placeholders alone do not satisfy accessible name requirements.

### ARIA Implementation Patterns
- **Switch Controls (`role="switch"`):** Use `role="switch"`, `aria-checked`, and link to an explicit text label via `aria-labelledby` or `aria-label`.
- **Tabs & Tabpanels:**
  - Tablist container uses `role="tablist"` with an `aria-label`.
  - Tab buttons use `role="tab"`, `id`, `aria-selected`, `aria-controls` (pointing to the panel `id`), and roving `tabIndex` (`0` for active tab, `-1` for inactive). Arrow keys switch tabs.
  - Tabpanels use `role="tabpanel"`, `id`, `aria-labelledby` (pointing to tab `id`), and `tabIndex={0}`.
- **Modal Dialogs:**
  - Container uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` (pointing to the dialog title element `id`).
  - Dialogs trap keyboard focus inside active content while open, handle `Escape` key to close, and restore focus to the trigger element upon closing.
- **List Reordering:** Interactive list items (such as profile chips) must support keyboard-driven reordering (e.g., `Alt + ArrowLeft` / `Alt + ArrowRight` or move left/right controls) with position announcements for screen readers.

### Verification
Run `pnpm lint:a11y` locally before submitting code to ensure zero static accessibility lint violations.

### Project structure

- `entrypoints/background.ts` — loads state and syncs dynamic rules.
- `entrypoints/popup/` — the React popup UI (`App.tsx`, `style.css`).
- `lib/types.ts` — core data model (`AppState`, `Profile`, `HeaderRule`).
- `lib/storage.ts` — load/save state and state-change events.
- `lib/dnr.ts` — converts app state into `declarativeNetRequest` rules.
- `lib/modheader.ts` — ModHeader-compatible import/export.

## Commit messages

This repository uses **[Conventional Commits](https://www.conventionalcommits.org/)**.
Commit messages drive automated versioning and releases, so the format matters:

| Prefix                                     | Effect                                 |
| ------------------------------------------ | -------------------------------------- |
| `fix:`                                     | Patch release (e.g. `1.2.3` → `1.2.4`) |
| `feat:`                                    | Minor release (e.g. `1.2.3` → `1.3.0`) |
| `feat!:` / `fix!:`                         | Major release (breaking change)        |
| `docs:` `chore:` `refactor:` `test:` `ci:` | No release                             |

A breaking change can also be signalled with a `BREAKING CHANGE:` footer.

Examples:

```
feat: add one-click CORS preset
fix: preserve rule order after profile rename
docs: clarify permission model in README
```

If you use squash merges, make sure the **squash commit title** follows this
format, since that becomes the commit recorded on `main`.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your change, keeping it focused and small where possible.
3. Run `pnpm compile` and `pnpm build`.
4. Open a PR with a clear description of the what and why. Note any permission
   or data-handling implications explicitly.

## Releases

Releases are automated. When commits are merged to `main`,
[semantic-release](https://semantic-release.gitbook.io/) analyzes the commit
messages, bumps the version, generates release notes, and publishes a GitHub
Release with the Chrome zip attached. You do not need to bump versions or tag
releases manually.

## Reporting issues

When filing a bug, please include:

- Browser and version
- Steps to reproduce
- What you expected vs. what happened
- Any relevant rule/profile configuration (with sensitive values redacted)

## License

By contributing, you agree that your contributions will be licensed under the
same license as this project.

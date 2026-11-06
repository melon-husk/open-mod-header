# Open ModHeader

![Open ModHeader](./open-modheader.png)

An open source, auditable tool to modify HTTP request and response headers. A
clean-by-design alternative to ModHeader, with no tracking, no telemetry, and no
header hoarding.

**[Install from the Chrome Web Store →](https://chromewebstore.google.com/detail/open-modheader/ggkoalhonillnaanakakfgjamcklphkk)**

## Why

Header tools need broad access to your traffic, which makes them a high-value
supply-chain target. Open ModHeader is built to be safe by design:

- **`declarativeNetRequest` only.** The browser applies your rules; the
  extension never reads your traffic.
- **No network calls.** Zero outbound requests, no analytics endpoints.
- **No header history.** Nothing is stored except your own rules.
- **Minimal permissions:** `declarativeNetRequest` and `storage`.

## Features

- Modify request and response headers (set or remove)
- Multiple profiles: switch, rename, duplicate, delete, and drag to reorder
- Tabbed request/response view with per-row, per-section, and global toggles
- Import and export profiles, compatible with ModHeader
- Light and dark themes that follow your system

## Usage

1. Open the extension popup and add a header with **Add request header** or
   **Add response header**.
2. Enter the header name and value. Use the **Set / Remove** control to either
   set a value or strip the header.
3. Toggle individual rows, a whole section, or everything with the **Global**
   switch.
4. Group related headers into **profiles** and switch between them. Only the
   active profile is applied.

Profiles can be copied to the clipboard and pasted into ModHeader (or another
Open ModHeader install) via **Copy** and **Import**.

## Browser Compatibility Matrix

Open ModHeader supports major modern desktop browsers using the `declarativeNetRequest` API.

| Browser | Target Engine & Manifest | Host Permission Requirements | Dynamic DNR Rule Quota Limit |
| ------- | ------------------------ | ---------------------------- | ---------------------------- |
| **Chrome** | Chromium (Manifest V3) | Prompted / Granted at install or via `chrome://extensions` | Up to 30,000 dynamic/session rules |
| **Firefox** | Gecko (Manifest V2 / V3) | Requires explicit grant in `about:addons` → Permissions tab | Up to 30,000 dynamic rules |
| **Edge** | Chromium (Manifest V3) | Prompted / Granted at install or via `edge://extensions` | Up to 30,000 dynamic/session rules |
| **Brave** | Chromium (Manifest V3) | Prompted / Granted at install or via `brave://extensions` | Up to 30,000 dynamic/session rules |

### Host Permission Setup Instructions

To modify HTTP headers on target websites, the extension requires host permissions (`<all_urls>`):

- **Firefox**:
  1. Open `about:addons` in the address bar.
  2. Select **Extensions** and click **Open ModHeader**.
  3. Navigate to the **Permissions** tab.
  4. Enable **Access your data for all websites** (or respond to the host permission prompt when loading the extension).
- **Chrome / Edge / Brave**:
  1. Open your browser's extension management page (`chrome://extensions`, `edge://extensions`, or `brave://extensions`).
  2. Click **Details** on Open ModHeader.
  3. Under **Site access**, ensure the permission is set to **On all sites** (or specify individual site access).

### Declarative Net Request Rule Quotas

Header modifications are executed natively by the browser engine using `declarativeNetRequest`.
- Each enabled rule in the active profile is converted to a dynamic DNR rule.
- Browser engines enforce strict limits on dynamic rules (up to **30,000 dynamic/session rules**).
- Keep total active profile rules within these quota boundaries to ensure all header modifications are applied cleanly without silent drops or browser API rejections.

## Background

Open ModHeader exists because a trusted header extension can quietly turn into a
liability. In 2026, a popular header tool was pulled from the Chrome Web Store
after a hidden data-collection SDK was found in a signed release. This project
takes the opposite stance: minimal permissions, no network access, and source
you can audit end to end.

## Develop

```sh
pnpm install

# Development mode (with hot reloading)
pnpm dev            # Run in Chrome / Chromium
pnpm dev:firefox    # Run in Firefox

# Production builds
pnpm build          # Production build for Chrome
pnpm build:firefox  # Production build for Firefox

# Extension packaging
pnpm zip            # Package Chrome extension into .output/
pnpm zip:firefox    # Package Firefox extension into .output/

# Type checking
pnpm compile        # Typecheck (tsc --noEmit)
```

Built with [WXT](https://wxt.dev) and React. Cross-browser targets (Chrome Manifest V3 and Firefox) are fully supported.

## Releasing

Releases are fully automated with
[semantic-release](https://semantic-release.gitbook.io/). Every push to `main`
runs the [release workflow](.github/workflows/release.yml), which inspects the
commit messages since the last release and decides what to publish.

Versioning follows [Conventional Commits](https://www.conventionalcommits.org/):

| Commit type                                | Release         |
| ------------------------------------------ | --------------- |
| `fix:`                                     | Patch (`1.0.1`) |
| `feat:`                                    | Minor (`1.1.0`) |
| `feat!:` / `fix!:` / `BREAKING CHANGE:`    | Major (`2.0.0`) |
| `docs:` `chore:` `ci:` `refactor:` `test:` | No release      |

When a releasable commit lands on `main`, the workflow bumps the version,
updates `CHANGELOG.md`, tags the release, and publishes a GitHub Release with both the
built Chrome and Firefox zip packages attached (`.output/*-chrome.zip` and `.output/*-firefox.zip`). If no commit warrants a release, the workflow succeeds
without publishing anything.

Commit messages are linted locally via a Husky `commit-msg` hook, so
non-conforming messages are rejected before they reach `main`. See
[CONTRIBUTING.md](./CONTRIBUTING.md) for details.

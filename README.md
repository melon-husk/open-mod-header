# Open Mod Header

![Open Mod Header](./open-modheader.png)

An open source, auditable tool to modify HTTP request and response headers. A
clean-by-design alternative to ModHeader, with no tracking, no telemetry, and no
header hoarding.

## Why

Header tools need broad access to your traffic, which makes them a high-value
supply-chain target. Open Mod Header is built to be safe by design:

- **`declarativeNetRequest` only.** The browser applies your rules; the
  extension never reads your traffic.
- **No network calls.** Zero outbound requests, no analytics endpoints.
- **No header history.** Nothing is stored except your own rules.
- **Minimal permissions:** `declarativeNetRequest` and `storage`.

## Features

- Modify request and response headers (set or remove)
- Multiple profiles: switch, rename, duplicate, delete, and drag to reorder
- Tabbed request/response view with per-row, per-section, and global toggles
- Presets for common tasks (for example, bypass CORS in one click)
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
5. Use **Presets** for common setups, such as one-click CORS bypass for local
   development.

Profiles can be copied to the clipboard and pasted into ModHeader (or another
Open Mod Header install) via **Copy** and **Import**.

## Background

Open Mod Header exists because a trusted header extension can quietly turn into a
liability. In 2026, a popular header tool was pulled from the Chrome Web Store
after a hidden data-collection SDK was found in a signed release. This project
takes the opposite stance: minimal permissions, no network access, and source
you can audit end to end.

## Develop

```sh
pnpm install
pnpm dev          # run in Chrome
pnpm build        # production build
pnpm compile      # typecheck
```

Built with [WXT](https://wxt.dev) and React. Chrome (Manifest V3) is the current
target.



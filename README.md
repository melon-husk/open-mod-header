# Open Mod Header

![Open Mod Header](./open-modheader.png)

An open source, auditable tool to modify HTTP request and response headers — a
clean-by-design alternative to ModHeader. No tracking, no telemetry, no header
hoarding.

## Why

Header tools need broad access to your traffic, which makes them a high-value
supply-chain target. Open Mod Header is built to be safe by design:

- **`declarativeNetRequest` only** — the browser applies your rules; the
  extension never reads your traffic.
- **No network calls** — zero outbound requests, no analytics endpoints.
- **No header history** — nothing is stored except your own rules.
- **Minimal permissions** — `declarativeNetRequest` and `storage`.

## Features

- Modify request and response headers (set or remove)
- Multiple profiles with quick switching
- Per-row, per-section, and global enable/disable
- Import/export profiles, compatible with ModHeader

## Develop

```sh
pnpm install
pnpm dev          # Chrome
pnpm build        # production build
pnpm compile      # typecheck
```

Built with [WXT](https://wxt.dev) and React.


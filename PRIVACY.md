# Privacy Policy

_Last updated: 11 July 2026_

**Open ModHeader** is designed to be private by default. It collects, stores,
and transmits **no personal data**.

## What we collect

Nothing. Open ModHeader does not collect, log, sell, or share any user data.

## What is stored

The only data the extension stores is **your own configuration** — the header
rules and profiles you create. This is kept **locally in your browser** using
the browser's `storage` API. It never leaves your device and is never sent to us
or any third party.

## Network activity

Open ModHeader makes **no network requests**. There are no analytics, no
telemetry, no remote configuration, and no outbound connections of any kind.

## Your web traffic

Open ModHeader modifies HTTP request and response headers using the browser's
`declarativeNetRequest` API. With this API, **the browser itself** applies your
rules — the extension never reads, records, or transmits the contents of your
requests, responses, or browsing activity.

## Permissions

- **`declarativeNetRequest`** — lets the browser apply your header rules without
  exposing your traffic to the extension.
- **`storage`** — saves your rules and profiles locally.
- **Host access (`<all_urls>`)** — required so your rules can apply to requests
  on any site you choose. Used only to apply your rules, never to read data.

## Remote code

Open ModHeader executes only the code bundled in its published package. It does
not download or run any remote code.

## Open source

Open ModHeader is fully open source and auditable. You can review every line at
https://github.com/melon-husk/open-mod-header.

## Contact

Questions about this policy? Open an issue at
https://github.com/melon-husk/open-mod-header/issues.

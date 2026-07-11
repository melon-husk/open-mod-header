import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Open ModHeader",
    description:
      "Open source tool to modify HTTP request and response headers. No tracking, no telemetry.",
    // declarativeNetRequest applies header rules in the browser itself, so the
    // extension never reads your traffic. storage persists your rules locally.
    permissions: ["declarativeNetRequest", "storage"],
    // Required for declarativeNetRequest header modification. Used ONLY to apply
    // your rules to matching requests — never to read or exfiltrate traffic.
    host_permissions: ["<all_urls>"],
  },
});

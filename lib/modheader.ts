import { createId } from "./storage";
import type { HeaderRule, HeaderTarget, Profile } from "./types";

/**
 * ModHeader's export format. A ModHeader export is a JSON array of profiles.
 * We map to/from it so profiles can be copied between the two extensions.
 * https://modheader.com/
 */
interface ModHeaderHeader {
  appendMode?: boolean;
  enabled?: boolean;
  name?: string;
  value?: string;
}

interface ModHeaderProfile {
  headers?: ModHeaderHeader[];
  respHeaders?: ModHeaderHeader[];
  title?: string;
  shortTitle?: string;
  version?: number;
}

function ruleToModHeader(rule: HeaderRule): ModHeaderHeader {
  return {
    appendMode: false,
    enabled: rule.enabled,
    name: rule.name,
    // ModHeader has no explicit "remove"; a name with an empty value removes it.
    value: rule.op === "remove" ? "" : rule.value,
  };
}

function shortTitleFor(name: string): string {
  const digits = name.match(/\d+/);
  if (digits) return digits[0];
  return name.trim().slice(0, 2) || "P";
}

export function profileToModHeader(profile: Profile): ModHeaderProfile {
  const headers = profile.rules
    .filter((r) => r.target === "request")
    .map(ruleToModHeader);
  const respHeaders = profile.rules
    .filter((r) => r.target === "response")
    .map(ruleToModHeader);

  const mh: ModHeaderProfile = {
    title: profile.name,
    shortTitle: shortTitleFor(profile.name),
    version: 2,
    headers,
  };
  if (respHeaders.length) mh.respHeaders = respHeaders;
  return mh;
}

/** Serialize profiles into a ModHeader-compatible JSON string. */
export function exportProfiles(profiles: Profile[]): string {
  return JSON.stringify(profiles.map(profileToModHeader));
}

function modHeaderToRule(
  header: ModHeaderHeader,
  target: HeaderTarget,
): HeaderRule {
  return {
    id: createId(),
    enabled: header.enabled ?? true,
    target,
    op: "set",
    name: header.name ?? "",
    value: header.value ?? "",
  };
}

function isBlank(header: ModHeaderHeader): boolean {
  return !(header.name ?? "").trim() && !(header.value ?? "").trim();
}

/**
 * Parse a ModHeader-compatible JSON string into our profiles.
 * Accepts either a single profile object or an array of profiles.
 * Throws if the input is not valid ModHeader JSON.
 */
export function importProfiles(text: string): Profile[] {
  const parsed = JSON.parse(text);
  const list: ModHeaderProfile[] = Array.isArray(parsed) ? parsed : [parsed];

  const profiles = list
    .filter((mh) => mh && typeof mh === "object")
    .map((mh, index): Profile => {
      const rules: HeaderRule[] = [];
      for (const header of mh.headers ?? []) {
        if (isBlank(header)) continue;
        rules.push(modHeaderToRule(header, "request"));
      }
      for (const header of mh.respHeaders ?? []) {
        if (isBlank(header)) continue;
        rules.push(modHeaderToRule(header, "response"));
      }
      return {
        id: createId(),
        name: mh.title?.trim() || `Imported profile ${index + 1}`,
        rules,
      };
    });

  if (profiles.length === 0) {
    throw new Error("No profiles found in the pasted text.");
  }
  return profiles;
}

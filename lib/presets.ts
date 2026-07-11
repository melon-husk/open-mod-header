import { createId } from "./storage";
import type { HeaderRule } from "./types";

export interface Preset {
  id: string;
  name: string;
  description: string;
  /** Header rules to add, minus the generated id. */
  headers: Omit<HeaderRule, "id">[];
}

/**
 * Built-in presets. Each applies a set of ready-to-use header rules to the
 * active profile.
 */
export const PRESETS: Preset[] = [
  {
    id: "cors",
    name: "Bypass CORS",
    description:
      "Adds permissive Access-Control-Allow-* response headers so cross-origin requests succeed during local development.",
    headers: [
      {
        enabled: true,
        target: "response",
        op: "set",
        name: "Access-Control-Allow-Origin",
        value: "*",
      },
      {
        enabled: true,
        target: "response",
        op: "set",
        name: "Access-Control-Allow-Methods",
        value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      },
      {
        enabled: true,
        target: "response",
        op: "set",
        name: "Access-Control-Allow-Headers",
        value: "*",
      },
    ],
  },
];

/** Materialize a preset's headers into rules with fresh ids. */
export function presetToRules(preset: Preset): HeaderRule[] {
  return preset.headers.map((h) => ({ ...h, id: createId() }));
}

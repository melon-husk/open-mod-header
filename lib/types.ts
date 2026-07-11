export type HeaderOp = "set" | "remove";
export type HeaderTarget = "request" | "response";

export interface HeaderRule {
  id: string;
  enabled: boolean;
  target: HeaderTarget;
  op: HeaderOp;
  name: string;
  /** Ignored when op === 'remove'. */
  value: string;
}

export interface Profile {
  id: string;
  name: string;
  rules: HeaderRule[];
}

export interface AppState {
  /** Master on/off for the whole extension. */
  globalEnabled: boolean;
  /** id of the profile currently applied. */
  activeProfileId: string;
  profiles: Profile[];
}

export const STORAGE_KEY = "state";

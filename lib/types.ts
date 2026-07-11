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
  /** Master toggle for the whole profile. */
  enabled: boolean;
  rules: HeaderRule[];
}

export const STORAGE_KEY = "profile";

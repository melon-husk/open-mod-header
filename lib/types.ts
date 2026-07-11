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
  /**
   * declarativeNetRequest urlFilter applied to every rule.
   * Empty string matches all URLs.
   */
  urlFilter: string;
  rules: HeaderRule[];
}

export const STORAGE_KEY = "profile";

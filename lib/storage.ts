import { STORAGE_KEY, type Profile } from "./types";

export function createDefaultProfile(): Profile {
  return {
    enabled: true,
    urlFilter: "",
    rules: [],
  };
}

export function createRuleId(): string {
  return crypto.randomUUID();
}

export async function loadProfile(): Promise<Profile> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const profile = stored[STORAGE_KEY] as Profile | undefined;
  return profile ?? createDefaultProfile();
}

export async function saveProfile(profile: Profile): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: profile });
}

/**
 * Subscribe to profile changes in storage. Returns an unsubscribe function.
 */
export function onProfileChanged(
  callback: (profile: Profile) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    const next = changes[STORAGE_KEY].newValue as Profile | undefined;
    callback(next ?? createDefaultProfile());
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

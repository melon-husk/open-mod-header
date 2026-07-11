import { STORAGE_KEY, type AppState, type HeaderRule, type Profile } from "./types";

const LEGACY_KEY = "profile";

export function createId(): string {
  return crypto.randomUUID();
}

/** @deprecated use createId */
export const createRuleId = createId;

export function createProfile(name: string): Profile {
  return { id: createId(), name, rules: [] };
}

export function createDefaultState(): AppState {
  const profile = createProfile("Profile 1");
  return {
    globalEnabled: true,
    activeProfileId: profile.id,
    profiles: [profile],
  };
}

export function getActiveProfile(state: AppState): Profile | undefined {
  return (
    state.profiles.find((p) => p.id === state.activeProfileId) ??
    state.profiles[0]
  );
}

interface LegacyProfile {
  enabled?: boolean;
  rules?: HeaderRule[];
}

export async function loadState(): Promise<AppState> {
  const stored = await browser.storage.local.get([STORAGE_KEY, LEGACY_KEY]);
  const state = stored[STORAGE_KEY] as AppState | undefined;
  if (state?.profiles?.length) return state;

  // Migrate the old single-profile shape into the multi-profile state.
  const legacy = stored[LEGACY_KEY] as LegacyProfile | undefined;
  if (legacy && Array.isArray(legacy.rules)) {
    const profile: Profile = {
      id: createId(),
      name: "Profile 1",
      rules: legacy.rules,
    };
    return {
      globalEnabled: legacy.enabled ?? true,
      activeProfileId: profile.id,
      profiles: [profile],
    };
  }

  return createDefaultState();
}

export async function saveState(state: AppState): Promise<void> {
  await browser.storage.local.set({ [STORAGE_KEY]: state });
}

/**
 * Subscribe to state changes in storage. Returns an unsubscribe function.
 */
export function onStateChanged(callback: (state: AppState) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) return;
    const next = changes[STORAGE_KEY].newValue as AppState | undefined;
    if (next) callback(next);
  };
  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}

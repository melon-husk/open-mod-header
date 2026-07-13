import type { AppState } from "./types";
import { getActiveProfile } from "./storage";

/**
 * Translate the active profile into declarativeNetRequest dynamic rules.
 *
 * Each enabled header rule becomes one DNR rule with a single header
 * modification. Grouping is avoided for clarity and predictable rule IDs.
 */
export function stateToDnrRules(
  state: AppState,
): chrome.declarativeNetRequest.Rule[] {
  if (!state.globalEnabled) return [];

  const profile = getActiveProfile(state);
  if (!profile) return [];

  const rules: chrome.declarativeNetRequest.Rule[] = [];
  let nextId = 1;

  for (const rule of profile.rules) {
    if (!rule.enabled) continue;
    if (!rule.name.trim()) continue;

    const headerInfo: chrome.declarativeNetRequest.ModifyHeaderInfo = {
      header: rule.name.trim(),
      operation:
        rule.op === "remove"
          ? chrome.declarativeNetRequest.HeaderOperation.REMOVE
          : chrome.declarativeNetRequest.HeaderOperation.SET,
      ...(rule.op === "set" ? { value: rule.value } : {}),
    };

    const action: chrome.declarativeNetRequest.RuleAction = {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      ...(rule.target === "request"
        ? { requestHeaders: [headerInfo] }
        : { responseHeaders: [headerInfo] }),
    };

    const condition: chrome.declarativeNetRequest.RuleCondition = {
      resourceTypes: Object.values(chrome.declarativeNetRequest.ResourceType),
    };

    rules.push({
      id: nextId++,
      priority: 1,
      action,
      condition,
    });
  }

  return rules;
}

/**
 * Replace all existing dynamic rules with the ones derived from the state.
 *
 * Calls are serialized: declarativeNetRequest.updateDynamicRules reads the
 * current dynamic rules to compute which IDs to remove, so two overlapping
 * syncs could otherwise both add a rule with the same ID and fail with
 * "Rule with id N does not have a unique ID".
 */
let syncQueue: Promise<void> = Promise.resolve();

export function syncDynamicRules(state: AppState): Promise<void> {
  const run = syncQueue.then(() => applySync(state));
  // Keep the queue chained even if a sync fails, so later syncs still run.
  syncQueue = run.catch(() => {});
  return run;
}

async function applySync(state: AppState): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  const addRules = stateToDnrRules(state);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

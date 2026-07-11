import type { Profile } from "./types";

/**
 * Translate our Profile into declarativeNetRequest dynamic rules.
 *
 * Each enabled header rule becomes one DNR rule with a single header
 * modification. Grouping is avoided for clarity and predictable rule IDs.
 */
export function profileToDnrRules(
  profile: Profile,
): chrome.declarativeNetRequest.Rule[] {
  if (!profile.enabled) return [];

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
      ...(profile.urlFilter.trim()
        ? { urlFilter: profile.urlFilter.trim() }
        : {}),
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
 * Replace all existing dynamic rules with the ones derived from the profile.
 */
export async function syncDynamicRules(profile: Profile): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  const addRules = profileToDnrRules(profile);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

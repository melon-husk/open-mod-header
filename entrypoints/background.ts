import type { AppState } from "@/lib/types";
import { loadState, onStateChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

// Match the popup's global toggle: blue when on, grey when off. Both keep
// their text above the WCAG 2.2 AA contrast ratio (>= 4.5:1).
const BADGE_BG_ON = "#2563eb"; // --purple-strong, ~5.2:1 with white text
const BADGE_BG_OFF = "#616161"; // grey
const BADGE_TEXT_ON = "#ffffff";
// Slightly dimmed white for the off state; ~80% alpha keeps ~4.65:1 on grey.
const BADGE_TEXT_OFF: [number, number, number, number] = [255, 255, 255, 204];

// Pad the shorter "ON" with a thin space (\u2009, not trimmed by Chrome) on
// each side so both states render at roughly the same badge width as "OFF".
const BADGE_TEXT_ON_LABEL = "\u2009ON\u2009";
const BADGE_TEXT_OFF_LABEL = "OFF";

/** Update the badge text and colour to reflect the global on/off state. */
function updateBadge(state: AppState): void {
  const text = state.globalEnabled ? BADGE_TEXT_ON_LABEL : BADGE_TEXT_OFF_LABEL;
  const color = state.globalEnabled ? BADGE_BG_ON : BADGE_BG_OFF;
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeTextColor?.({
    color: state.globalEnabled ? BADGE_TEXT_ON : BADGE_TEXT_OFF,
  });
}

export default defineBackground(() => {
  // Apply saved rules on startup / install.
  loadState().then((state) => {
    syncDynamicRules(state);
    updateBadge(state);
  });

  // Keep dynamic rules and badge in sync whenever the state changes.
  onStateChanged((state) => {
    syncDynamicRules(state);
    updateBadge(state);
  });
});

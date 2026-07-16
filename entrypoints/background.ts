import type { AppState } from "@/lib/types";
import { loadState, onStateChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

// Match the popup's global toggle: blue when on, grey when off. Both keep
// white text above the WCAG 2.2 AA contrast ratio (>= 4.5:1).
const BADGE_BG_ON = "#2563eb"; // --purple-strong, ~5.2:1 with white text
const BADGE_BG_OFF = "#616161"; // grey, ~5.7:1 with white text
const BADGE_TEXT_COLOR = "#ffffff";

/** Update the badge text and colour to reflect the global on/off state. */
function updateBadge(state: AppState): void {
  const text = state.globalEnabled ? "ON" : "OFF";
  const color = state.globalEnabled ? BADGE_BG_ON : BADGE_BG_OFF;
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeTextColor?.({ color: BADGE_TEXT_COLOR });
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

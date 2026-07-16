import type { AppState } from "@/lib/types";
import { loadState, onStateChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

// Badge colours chosen so the white text meets the WCAG 2.2 AA contrast
// ratio (>= 4.5:1) against each background.
const BADGE_BG_ON = "#2e7d32"; // green, ~5.1:1 with white text
const BADGE_BG_OFF = "#616161"; // grey, ~5.7:1 with white text
const BADGE_TEXT_COLOR = "#ffffff";

/** Update the badge text and colour to reflect the global on/off state. */
function updateBadge(state: AppState): void {
  const text = state.globalEnabled ? "ON" : "OFF";
  const color = state.globalEnabled ? BADGE_BG_ON : BADGE_BG_OFF;
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  // Lock the text colour so contrast doesn't depend on the browser's
  // implicit auto-selection. Guarded because it's not in all typings/versions.
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

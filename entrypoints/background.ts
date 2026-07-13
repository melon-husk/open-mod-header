import type { AppState } from "@/lib/types";
import { loadState, onStateChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

/** Update the badge text and colour to reflect the global on/off state. */
function updateBadge(state: AppState): void {
  const text = state.globalEnabled ? "ON" : "OFF";
  const color = state.globalEnabled ? "#4caf50" : "#9e9e9e";
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
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

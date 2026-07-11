import { loadState, onStateChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

export default defineBackground(() => {
  // Apply saved rules on startup / install.
  loadState().then(syncDynamicRules);

  // Keep dynamic rules in sync whenever the state changes.
  onStateChanged(syncDynamicRules);
});

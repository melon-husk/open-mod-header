import { loadProfile, onProfileChanged } from "@/lib/storage";
import { syncDynamicRules } from "@/lib/dnr";

export default defineBackground(() => {
  // Apply saved rules on startup / install.
  loadProfile().then(syncDynamicRules);

  // Keep dynamic rules in sync whenever the profile changes.
  onProfileChanged(syncDynamicRules);
});

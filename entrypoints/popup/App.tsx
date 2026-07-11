import { useEffect, useState } from "react";
import type { HeaderRule, HeaderTarget, Profile } from "@/lib/types";
import { createRuleId, loadProfile, saveProfile } from "@/lib/storage";

function App() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  // Persist on every change. Background listens to storage and re-syncs rules.
  function update(next: Profile) {
    setProfile(next);
    saveProfile(next);
  }

  if (!profile) return <div className="loading">Loading…</div>;

  function addRule() {
    const rule: HeaderRule = {
      id: createRuleId(),
      enabled: true,
      target: "request",
      op: "set",
      name: "",
      value: "",
    };
    update({ ...profile!, rules: [...profile!.rules, rule] });
  }

  function patchRule(id: string, patch: Partial<HeaderRule>) {
    update({
      ...profile!,
      rules: profile!.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  }

  function removeRule(id: string) {
    update({ ...profile!, rules: profile!.rules.filter((r) => r.id !== id) });
  }

  return (
    <div className="app">
      <header className="topbar">
        <label className="master">
          <input
            type="checkbox"
            checked={profile.enabled}
            onChange={(e) => update({ ...profile, enabled: e.target.checked })}
          />
          <span>{profile.enabled ? "Enabled" : "Disabled"}</span>
        </label>
        <h1>Open Mod Header</h1>
      </header>

      <label className="filter">
        <span>URL filter</span>
        <input
          type="text"
          placeholder="All URLs"
          value={profile.urlFilter}
          onChange={(e) => update({ ...profile, urlFilter: e.target.value })}
        />
      </label>

      <div className="rules">
        {profile.rules.length === 0 && (
          <p className="empty">No headers yet. Add one below.</p>
        )}
        {profile.rules.map((rule) => (
          <div className="row" key={rule.id}>
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) =>
                patchRule(rule.id, { enabled: e.target.checked })
              }
              title="Enable / disable"
            />
            <select
              value={rule.target}
              onChange={(e) =>
                patchRule(rule.id, { target: e.target.value as HeaderTarget })
              }
              title="Request or response header"
            >
              <option value="request">Req</option>
              <option value="response">Res</option>
            </select>
            <select
              value={rule.op}
              onChange={(e) =>
                patchRule(rule.id, { op: e.target.value as HeaderRule["op"] })
              }
              title="Set or remove"
            >
              <option value="set">Set</option>
              <option value="remove">Remove</option>
            </select>
            <input
              className="name"
              type="text"
              placeholder="Header name"
              value={rule.name}
              onChange={(e) => patchRule(rule.id, { name: e.target.value })}
            />
            <input
              className="value"
              type="text"
              placeholder={rule.op === "remove" ? "(removed)" : "Value"}
              value={rule.value}
              disabled={rule.op === "remove"}
              onChange={(e) => patchRule(rule.id, { value: e.target.value })}
            />
            <button
              className="remove"
              onClick={() => removeRule(rule.id)}
              title="Delete row"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button className="add" onClick={addRule}>
        + Add header
      </button>
    </div>
  );
}

export default App;

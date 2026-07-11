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

  function addRule(target: HeaderTarget) {
    const rule: HeaderRule = {
      id: createRuleId(),
      enabled: true,
      target,
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

  function setSectionEnabled(target: HeaderTarget, enabled: boolean) {
    update({
      ...profile!,
      rules: profile!.rules.map((r) =>
        r.target === target ? { ...r, enabled } : r,
      ),
    });
  }

  function renderSection(target: HeaderTarget, title: string) {
    const rows = profile!.rules.filter((r) => r.target === target);
    const allOn = rows.length > 0 && rows.every((r) => r.enabled);

    return (
      <section className="section">
        <div className="section-head">
          <input
            type="checkbox"
            checked={allOn}
            disabled={rows.length === 0}
            onChange={(e) => setSectionEnabled(target, e.target.checked)}
            title="Enable / disable all in this section"
          />
          <h2 className="section-title">{title}</h2>
        </div>

        {rows.length > 0 && (
          <div className="col-labels">
            <span className="col-name">Name</span>
            <span className="col-value">Value</span>
          </div>
        )}

        <div className="rules">
          {rows.map((rule) => (
            <div className="row" key={rule.id}>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) =>
                  patchRule(rule.id, { enabled: e.target.checked })
                }
                title="Enable / disable"
              />
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
                placeholder={rule.op === "remove" ? "Removed" : "Value"}
                value={rule.value}
                disabled={rule.op === "remove"}
                onChange={(e) => patchRule(rule.id, { value: e.target.value })}
              />
              <select
                className="op"
                value={rule.op}
                onChange={(e) =>
                  patchRule(rule.id, { op: e.target.value as HeaderRule["op"] })
                }
                title="Set or remove this header"
              >
                <option value="set">Set</option>
                <option value="remove">Remove</option>
              </select>
              <button
                className="trash"
                onClick={() => removeRule(rule.id)}
                title="Delete"
                aria-label="Delete header"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}

          {rows.length === 0 && (
            <p className="empty">No {title.toLowerCase()} yet.</p>
          )}
        </div>

        <button className="add-row" onClick={() => addRule(target)}>
          Add {title.toLowerCase().replace(/s$/, "")}
        </button>
      </section>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Open Mod Header</span>
        </div>
        <label className="global">
          <span className="global-label">Global</span>
          <button
            type="button"
            role="switch"
            aria-checked={profile.enabled}
            className={`toggle ${profile.enabled ? "on" : ""}`}
            onClick={() => update({ ...profile, enabled: !profile.enabled })}
          >
            <span className="knob" />
            <span className="toggle-text">{profile.enabled ? "ON" : "OFF"}</span>
          </button>
        </label>
      </header>

      <main className={`card ${profile.enabled ? "" : "paused"}`}>
        <div className="card-head">
          <span className="profile-badge">1</span>
          <h1 className="card-title">Profile 1</h1>
        </div>

        {renderSection("request", "Request headers")}
        {renderSection("response", "Response headers")}
      </main>
    </div>
  );
}

export default App;

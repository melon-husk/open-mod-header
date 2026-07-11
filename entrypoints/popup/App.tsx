import { useEffect, useMemo, useState } from "react";
import type { AppState, HeaderRule, HeaderTarget, Profile } from "@/lib/types";
import {
  createId,
  createProfile,
  getActiveProfile,
  loadState,
  saveState,
} from "@/lib/storage";
import { exportProfiles, importProfiles } from "@/lib/modheader";
import { PRESETS, presetToRules, type Preset } from "@/lib/presets";

function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<HeaderTarget>("request");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const active = useMemo(
    () => (state ? getActiveProfile(state) : undefined),
    [state],
  );

  // Persist on every change. Background listens to storage and re-syncs rules.
  function commit(next: AppState) {
    setState(next);
    saveState(next);
  }

  if (!state || !active) return <div className="loading">Loading…</div>;

  function updateActive(mutate: (profile: Profile) => Profile) {
    commit({
      ...state!,
      profiles: state!.profiles.map((p) =>
        p.id === active!.id ? mutate(p) : p,
      ),
    });
  }

  function switchProfile(id: string) {
    commit({ ...state!, activeProfileId: id });
  }

  function reorderProfiles(fromId: string, toId: string) {
    if (fromId === toId) return;
    const profiles = [...state!.profiles];
    const from = profiles.findIndex((p) => p.id === fromId);
    const to = profiles.findIndex((p) => p.id === toId);
    if (from === -1 || to === -1) return;
    const [moved] = profiles.splice(from, 1);
    profiles.splice(to, 0, moved);
    commit({ ...state!, profiles });
  }

  function newProfile() {
    const profile = createProfile(`Profile ${state!.profiles.length + 1}`);
    commit({
      ...state!,
      profiles: [...state!.profiles, profile],
      activeProfileId: profile.id,
    });
  }

  function duplicateProfile() {
    const copy: Profile = {
      id: createId(),
      name: `${active!.name} copy`,
      rules: active!.rules.map((r) => ({ ...r, id: createId() })),
    };
    commit({
      ...state!,
      profiles: [...state!.profiles, copy],
      activeProfileId: copy.id,
    });
  }

  function deleteProfile() {
    if (state!.profiles.length <= 1) return;
    const remaining = state!.profiles.filter((p) => p.id !== active!.id);
    commit({
      ...state!,
      profiles: remaining,
      activeProfileId: remaining[0].id,
    });
    setConfirmDelete(false);
  }

  function renameProfile(name: string) {
    updateActive((p) => ({ ...p, name }));
  }

  function addRule(target: HeaderTarget) {
    const rule: HeaderRule = {
      id: createId(),
      enabled: true,
      target,
      op: "set",
      name: "",
      value: "",
    };
    updateActive((p) => ({ ...p, rules: [...p.rules, rule] }));
  }

  function patchRule(id: string, patch: Partial<HeaderRule>) {
    updateActive((p) => ({
      ...p,
      rules: p.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeRule(id: string) {
    updateActive((p) => ({ ...p, rules: p.rules.filter((r) => r.id !== id) }));
  }

  function setSectionEnabled(target: HeaderTarget, enabled: boolean) {
    updateActive((p) => ({
      ...p,
      rules: p.rules.map((r) => (r.target === target ? { ...r, enabled } : r)),
    }));
  }

  async function copyProfile() {
    try {
      await navigator.clipboard.writeText(exportProfiles([active!]));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function runImport() {
    try {
      const imported = importProfiles(importText);
      commit({
        ...state!,
        profiles: [...state!.profiles, ...imported],
        activeProfileId: imported[0].id,
      });
      setImportOpen(false);
      setImportText("");
      setImportError(null);
    } catch {
      setImportError("Couldn't read that. Paste a valid ModHeader profile.");
    }
  }

  function applyPreset(preset: Preset) {
    const additions = presetToRules(preset);
    // Replace any existing rule with the same target + name (case-insensitive)
    // so re-applying refreshes values instead of creating duplicates.
    const conflict = (r: HeaderRule) =>
      additions.some(
        (a) =>
          a.target === r.target &&
          a.name.toLowerCase() === r.name.toLowerCase(),
      );
    updateActive((p) => ({
      ...p,
      rules: [...p.rules.filter((r) => !conflict(r)), ...additions],
    }));
    // Show the tab where the preset added headers.
    setTab(additions[0]?.target ?? "request");
    setPresetsOpen(false);
  }

  function renderPanel(target: HeaderTarget, title: string) {
    const rows = active!.rules.filter((r) => r.target === target);
    const allOn = rows.length > 0 && rows.every((r) => r.enabled);
    const noun = title.toLowerCase();

    return (
      <section className="section">
        <div className="section-head">
          <label className="enable-all">
            <input
              type="checkbox"
              checked={allOn}
              disabled={rows.length === 0}
              onChange={(e) => setSectionEnabled(target, e.target.checked)}
            />
            <span>Enable all</span>
          </label>
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

          {rows.length === 0 && <p className="empty">No {noun} yet.</p>}
        </div>

        <button className="add-row" onClick={() => addRule(target)}>
          Add {noun.replace(/s$/, "")}
        </button>
      </section>
    );
  }

  const activeIndex = state.profiles.findIndex((p) => p.id === active.id);
  const requestCount = active.rules.filter(
    (r) => r.target === "request",
  ).length;
  const responseCount = active.rules.filter(
    (r) => r.target === "response",
  ).length;

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
            aria-checked={state.globalEnabled}
            className={`toggle ${state.globalEnabled ? "on" : ""}`}
            onClick={() =>
              commit({ ...state, globalEnabled: !state.globalEnabled })
            }
          >
            <span className="knob" />
            <span className="toggle-text">
              {state.globalEnabled ? "ON" : "OFF"}
            </span>
          </button>
        </label>
      </header>

      <nav className="profile-bar">
        <div className="chips">
          {state.profiles.map((p) => (
            <button
              key={p.id}
              className={`chip ${p.id === active.id ? "active" : ""} ${
                dragId === p.id ? "dragging" : ""
              } ${dragOverId === p.id ? "drag-over" : ""}`}
              onClick={() => switchProfile(p.id)}
              title={p.name}
              draggable
              onDragStart={() => setDragId(p.id)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragId && dragId !== p.id) setDragOverId(p.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorderProfiles(dragId, p.id);
                setDragId(null);
                setDragOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDragOverId(null);
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="profile-bar-actions">
          <div className="presets">
            <button
              className="ghost-btn"
              onClick={() => setPresetsOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={presetsOpen}
            >
              Presets
            </button>
            {presetsOpen && (
              <>
                <div
                  className="menu-backdrop"
                  onClick={() => setPresetsOpen(false)}
                />
                <div className="menu" role="menu">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className="menu-item"
                      role="menuitem"
                      onClick={() => applyPreset(preset)}
                    >
                      <span className="menu-item-name">{preset.name}</span>
                      <span className="menu-item-desc">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="ghost-btn" onClick={newProfile}>
            + New
          </button>
          <button
            className="ghost-btn"
            onClick={() => {
              setImportError(null);
              setImportText("");
              setImportOpen(true);
            }}
          >
            Import
          </button>
        </div>
      </nav>

      <main className={`card ${state.globalEnabled ? "" : "paused"}`}>
        <div className="card-head">
          <span className="profile-badge">{activeIndex + 1}</span>
          <input
            className="title-input"
            value={active.name}
            onChange={(e) => renameProfile(e.target.value)}
            aria-label="Profile name"
          />
          <div className="card-actions">
            <button className="ghost-btn" onClick={copyProfile}>
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              className="icon-action"
              onClick={duplicateProfile}
              title="Duplicate profile"
              aria-label="Duplicate profile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="9"
                  y="9"
                  width="11"
                  height="11"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M5 15V5a2 2 0 0 1 2-2h10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              className="icon-action danger"
              onClick={() => setConfirmDelete(true)}
              disabled={state.profiles.length <= 1}
              title="Delete profile"
              aria-label="Delete profile"
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
        </div>

        <div className="tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "request"}
            className={`tab ${tab === "request" ? "active" : ""}`}
            onClick={() => setTab("request")}
          >
            Request
            <span className="tab-count">{requestCount}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "response"}
            className={`tab ${tab === "response" ? "active" : ""}`}
            onClick={() => setTab("response")}
          >
            Response
            <span className="tab-count">{responseCount}</span>
          </button>
        </div>

        {tab === "request"
          ? renderPanel("request", "Request headers")
          : renderPanel("response", "Response headers")}
      </main>

      {importOpen && (
        <div className="modal-backdrop" onClick={() => setImportOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Import profile</h3>
            <p className="modal-hint">
              Paste a ModHeader profile (or an Open Mod Header export).
            </p>
            <textarea
              className="import-text"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"headers":[…],"title":"Profile 1","version":2}]'
              rows={6}
              autoFocus
            />
            {importError && <p className="modal-error">{importError}</p>}
            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() => setImportOpen(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={runImport}
                disabled={!importText.trim()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete profile</h3>
            <p className="modal-hint">
              Delete <strong>{active.name}</strong> and its{" "}
              {active.rules.length}{" "}
              {active.rules.length === 1 ? "header" : "headers"}? This can't be
              undone.
            </p>
            <div className="modal-actions">
              <button
                className="ghost-btn"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button className="danger-btn" onClick={deleteProfile} autoFocus>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

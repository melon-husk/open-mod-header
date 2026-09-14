import { useEffect, useMemo, useRef, useState } from "react";
import type { AppState, HeaderRule, HeaderTarget, Profile } from "@/lib/types";
import {
  createId,
  createProfile,
  getActiveProfile,
  loadState,
  saveState,
} from "@/lib/storage";
import { exportProfiles, importProfiles } from "@/lib/modheader";

function Modal({
  titleId,
  title,
  isOpen,
  onClose,
  children,
}: {
  titleId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const getFocusable = () => {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const elements = getFocusable();
        if (elements.length === 0) return;

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
        tabIndex={-1}
      >
        <h3 id={titleId} className="modal-title">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

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

  function renderPanel(target: HeaderTarget, title: string) {
    const rows = active!.rules.filter((r) => r.target === target);
    const allOn = rows.length > 0 && rows.every((r) => r.enabled);
    const noun = title.toLowerCase();

    return (
      <section
        className="section"
        role="tabpanel"
        id={`panel-${target}`}
        aria-labelledby={`tab-${target}`}
        tabIndex={0}
      >
        <div className="section-head">
          <label className="enable-all">
            <input
              type="checkbox"
              checked={allOn}
              disabled={rows.length === 0}
              onChange={(e) => setSectionEnabled(target, e.target.checked)}
              aria-label={`Enable all ${noun}`}
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
          {rows.map((rule, idx) => (
            <div className="row" key={rule.id}>
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) =>
                  patchRule(rule.id, { enabled: e.target.checked })
                }
                title="Enable / disable"
                aria-label={`Enable ${target} rule ${idx + 1}`}
              />
              <input
                className="name"
                type="text"
                placeholder="Header name"
                value={rule.name}
                onChange={(e) => patchRule(rule.id, { name: e.target.value })}
                aria-label={`${title} rule ${idx + 1} name`}
              />
              <input
                className="value"
                type="text"
                placeholder={rule.op === "remove" ? "Removed" : "Value"}
                value={rule.value}
                disabled={rule.op === "remove"}
                onChange={(e) => patchRule(rule.id, { value: e.target.value })}
                aria-label={`${title} rule ${idx + 1} value`}
              />
              <select
                className="op"
                value={rule.op}
                onChange={(e) =>
                  patchRule(rule.id, { op: e.target.value as HeaderRule["op"] })
                }
                title="Set or remove this header"
                aria-label={`${title} rule ${idx + 1} operation`}
              >
                <option value="set">Set</option>
                <option value="remove">Remove</option>
              </select>
              <button
                className="trash"
                onClick={() => removeRule(rule.id)}
                title="Delete"
                aria-label={`Delete ${target} rule ${idx + 1}`}
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
          <span className="brand-name">Open ModHeader</span>
        </div>
        <div className="global">
          <span id="global-toggle-label" className="global-label">
            Global
          </span>
          <button
            type="button"
            role="switch"
            id="global-switch"
            aria-labelledby="global-toggle-label"
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
        </div>
      </header>

      <nav className="profile-bar" aria-label="Profile tabs">
        <div className="chips">
          {state.profiles.map((p, index) => (
            <button
              key={p.id}
              className={`chip ${p.id === active.id ? "active" : ""} ${
                dragId === p.id ? "dragging" : ""
              } ${dragOverId === p.id ? "drag-over" : ""}`}
              onClick={() => switchProfile(p.id)}
              title={p.name}
              aria-label={`Profile ${p.name}, ${index + 1} of ${
                state.profiles.length
              }. Press Alt+Left or Alt+Right to reorder.`}
              onKeyDown={(e) => {
                if ((e.altKey || e.metaKey) && e.key === "ArrowLeft") {
                  e.preventDefault();
                  if (index > 0) {
                    reorderProfiles(p.id, state.profiles[index - 1].id);
                  }
                } else if ((e.altKey || e.metaKey) && e.key === "ArrowRight") {
                  e.preventDefault();
                  if (index < state.profiles.length - 1) {
                    reorderProfiles(p.id, state.profiles[index + 1].id);
                  }
                }
              }}
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
            <button
              className="icon-action"
              onClick={() => {
                if (activeIndex > 0) {
                  reorderProfiles(active.id, state.profiles[activeIndex - 1].id);
                }
              }}
              disabled={activeIndex === 0}
              title="Move profile left"
              aria-label="Move profile left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="icon-action"
              onClick={() => {
                if (activeIndex < state.profiles.length - 1) {
                  reorderProfiles(active.id, state.profiles[activeIndex + 1].id);
                }
              }}
              disabled={activeIndex === state.profiles.length - 1}
              title="Move profile right"
              aria-label="Move profile right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
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

        <div className="tabs" role="tablist" aria-label="Header types">
          <button
            role="tab"
            id="tab-request"
            aria-selected={tab === "request"}
            aria-controls="panel-request"
            tabIndex={tab === "request" ? 0 : -1}
            className={`tab ${tab === "request" ? "active" : ""}`}
            onClick={() => setTab("request")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                setTab("response");
                document.getElementById("tab-response")?.focus();
              }
            }}
          >
            Request
            <span className="tab-count">{requestCount}</span>
          </button>
          <button
            role="tab"
            id="tab-response"
            aria-selected={tab === "response"}
            aria-controls="panel-response"
            tabIndex={tab === "response" ? 0 : -1}
            className={`tab ${tab === "response" ? "active" : ""}`}
            onClick={() => setTab("response")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                setTab("request");
                document.getElementById("tab-request")?.focus();
              }
            }}
          >
            Response
            <span className="tab-count">{responseCount}</span>
          </button>
        </div>

        {tab === "request"
          ? renderPanel("request", "Request headers")
          : renderPanel("response", "Response headers")}
      </main>

      <Modal
        titleId="import-modal-title"
        title="Import profile"
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      >
        <p className="modal-hint">
          Paste a ModHeader profile (or an Open ModHeader export).
        </p>
        <textarea
          className="import-text"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='[{"headers":[…],"title":"Profile 1","version":2}]'
          rows={6}
          aria-label="ModHeader profile JSON import"
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
      </Modal>

      <Modal
        titleId="delete-modal-title"
        title="Delete profile"
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
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
          <button className="danger-btn" onClick={deleteProfile}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;

import React, { useState } from "react";
import { getScripts } from "../api";
import "./Topbar.css";

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <rect x="4" y="2" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7"/>
    <rect x="3" y="8" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.5"/>
  </svg>
);

const NodeboxIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="7" height="7" rx="2" fill="var(--color-accent)" />
    <rect x="11" y="2" width="7" height="7" rx="2" fill="var(--color-accent)" opacity="0.6" />
    <rect x="2" y="11" width="7" height="7" rx="2" fill="var(--color-accent)" opacity="0.6" />
    <rect x="11" y="11" width="7" height="7" rx="2" fill="var(--color-accent)" opacity="0.35" />
  </svg>
);

function SaveDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  return (
    <div className="topbar__dialog-overlay" onClick={onCancel}>
      <div className="topbar__dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="topbar__dialog-title">Save Script</h3>
        <input
          className="topbar__dialog-input"
          type="text"
          placeholder="filename.js"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
        />
        <div className="topbar__dialog-actions">
          <button className="topbar__dialog-btn topbar__dialog-btn--cancel" onClick={onCancel}>Cancel</button>
          <button
            className="topbar__dialog-btn topbar__dialog-btn--confirm"
            onClick={() => name.trim() && onConfirm(name.trim())}
            disabled={!name.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function ScriptsModal({ scripts, fetchError, onLoad, onClose }) {
  return (
    <div className="topbar__dialog-overlay" onClick={onClose}>
      <div className="topbar__dialog topbar__dialog--list" onClick={(e) => e.stopPropagation()}>
        <h3 className="topbar__dialog-title">Saved Scripts</h3>
        {fetchError ? (
          <p className="topbar__dialog-empty topbar__dialog-error">{fetchError}</p>
        ) : scripts.length === 0 ? (
          <p className="topbar__dialog-empty">No saved scripts yet.</p>
        ) : (
          <ul className="topbar__scripts-list">
            {scripts.map((name) => (
              <li key={name} className="topbar__scripts-item">
                <button className="topbar__scripts-name" onClick={() => { onLoad(name); onClose(); }}>
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="topbar__dialog-actions">
          <button className="topbar__dialog-btn topbar__dialog-btn--cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Topbar({ filename, loading, onRun, onSave, onLoad }) {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const shortcut = isMac ? "⌘↵" : "Ctrl+↵";
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showScripts, setShowScripts] = useState(false);
  const [scripts, setScripts] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSaveConfirm = async (name) => {
    setSaving(true);
    try {
      await onSave(name);
    } finally {
      setSaving(false);
    }
    setShowSaveDialog(false);
  };

  const openScripts = async () => {
    setShowScripts(true);
    setFetchError(null);
    setScripts([]);
    try {
      const data = await getScripts();
      // normalise: accept array of strings or array of { name } objects
      const names = data.map((item) => (typeof item === "string" ? item : item.name));
      setScripts(names);
    } catch (err) {
      setFetchError(err.message);
    }
  };

  return (
    <>
      <header className="topbar" role="banner">
        {/* Left: Brand */}
        <div className="topbar__brand">
          <NodeboxIcon />
          <span className="topbar__brand-name">NodeBox</span>
          <span className="topbar__brand-divider" aria-hidden="true" />
          <button
            className="topbar__filename topbar__filename--btn"
            title="Browse saved scripts"
            onClick={openScripts}
          >
            {filename}
          </button>
        </div>

        {/* Center: Status indicator */}
        <div className="topbar__center" aria-live="polite">
          {loading && (
            <span className="topbar__status">
              <span className="topbar__spinner" aria-hidden="true" />
              Running…
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="topbar__actions">
          <kbd className="topbar__shortcut" aria-label={`Keyboard shortcut: ${shortcut}`}>
            {shortcut}
          </kbd>
          <button
            className="topbar__save-btn"
            onClick={() => setShowSaveDialog(true)}
            disabled={saving}
            aria-label="Save script"
          >
            <SaveIcon />
            <span>{saving ? "Saving…" : "Save"}</span>
          </button>
          <button
            className="topbar__run-btn"
            onClick={onRun}
            disabled={loading}
            aria-label="Run code"
            aria-busy={loading}
          >
            <PlayIcon />
            <span>{loading ? "Running" : "Run"}</span>
          </button>
        </div>
      </header>

      {showSaveDialog && (
        <SaveDialog
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {showScripts && (
        <ScriptsModal
          scripts={scripts}
          fetchError={fetchError}
          onLoad={onLoad}
          onClose={() => setShowScripts(false)}
        />
      )}
    </>
  );
}

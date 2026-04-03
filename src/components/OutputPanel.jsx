import React, { useEffect, useRef } from "react";
import "./OutputPanel.css";

const ClearIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M2 2L11 11M11 2L2 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 4L6 7L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Parses raw output string into typed log lines for richer display.
 * Lines starting with "Error:" are rendered as errors, otherwise as logs.
 */
function parseOutput(raw) {
  if (!raw) return [];
  return raw.split("\n").map((line, i) => {
    const isError = line.startsWith("Error:") || line.startsWith("TypeError:") || line.startsWith("ReferenceError:") || line.startsWith("SyntaxError:");
    return { id: i, text: line, type: isError ? "error" : "log" };
  });
}

export default function OutputPanel({ output, onClear }) {
  const bottomRef = useRef(null);
  const lines = parseOutput(output);
  const isEmpty = lines.length === 0;

  /* Auto-scroll to bottom on new output */
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [output]);

  return (
    <section
      className="output-panel"
      aria-label="Console output"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {/* Panel Header */}
      <div className="output-panel__header">
        <div className="output-panel__title">
          <TerminalIcon />
          <span>Console</span>
          {!isEmpty && (
            <span className="output-panel__count" aria-label={`${lines.length} lines`}>
              {lines.length}
            </span>
          )}
        </div>
        <button
          className="output-panel__clear-btn"
          onClick={onClear}
          disabled={isEmpty}
          aria-label="Clear console output"
          title="Clear output"
        >
          <ClearIcon />
          <span>Clear</span>
        </button>
      </div>

      {/* Output Body */}
      <div className="output-panel__body">
        {isEmpty ? (
          <div className="output-panel__empty">
            <span className="output-panel__empty-icon" aria-hidden="true">▶</span>
            <p>Run your code to see output here.</p>
            <p className="output-panel__empty-hint">Use <kbd>Ctrl+↵</kbd> for quick run.</p>
          </div>
        ) : (
          <div className="output-panel__lines" role="list">
            {lines.map(({ id, text, type }) => (
              <div
                key={id}
                className={`output-panel__line output-panel__line--${type}`}
                role="listitem"
              >
                <span className="output-panel__line-num" aria-hidden="true">
                  {id + 1}
                </span>
                <span className="output-panel__line-text">{text}</span>
              </div>
            ))}
            <div ref={bottomRef} aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}

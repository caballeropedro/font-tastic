export const DEVTOOL_CSS = `
/* ------------------------------------------------------------------ */
/* Tokens + isolation from the host page                               */
/* ------------------------------------------------------------------ */
.ft-root {
  --ft-bg: #111111;
  --ft-surface: #1b1b1b;
  --ft-active: #272727;
  --ft-hover: #202020;
  --ft-border: #2e2e2e;
  --ft-rule: #222222;
  --ft-control: #474747;
  --ft-text: #f5f5f5;
  --ft-muted: #b4b4b4;
  --ft-faint: #949494;
  --ft-accent: #3b82f6;
  --ft-accent-hover: #2f6fe0;
  --ft-accent-text: #7fb0ff;
  --ft-positive: #3fc07a;
  --ft-positive-bg: #172a1d;
  --ft-pending: #e9ad45;
  --ft-pending-bg: #2b2212;
  --ft-negative: #f08a8a;
  --ft-negative-bg: #2c1a1a;
  --ft-code-bg: #0a0a0a;
  --ft-radius: 8px;
  --ft-radius-control: 6px;
  --ft-control-h: 32px;
  --ft-face: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --ft-face-code: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  font-family: var(--ft-face) !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  font-style: normal !important;
  line-height: 1.45 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  text-align: left !important;
  color: var(--ft-text) !important;
  color-scheme: dark !important;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}

.ft-root *, .ft-root *::before, .ft-root *::after {
  box-sizing: border-box !important;
}

.ft-root :where(button, input, select, label, pre, code, kbd, p, span, div) {
  margin: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: none;
  color: inherit;
}

.ft-root :where(button) {
  appearance: none;
  -webkit-appearance: none;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-align: inherit;
  min-height: 0;
  box-shadow: none;
}

.ft-root :where(button, input, select, [tabindex]):focus-visible {
  outline: 2px solid var(--ft-accent);
  outline-offset: 1px;
}

.ft-root :where(button):disabled {
  cursor: default;
  opacity: 0.55;
}

.ft-root,
.ft-root * {
  scrollbar-width: thin;
  scrollbar-color: #3a3a3a transparent;
}
.ft-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.ft-root ::-webkit-scrollbar-track { background: transparent; }
.ft-root ::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 999px;
  border: 2px solid var(--ft-bg);
}
.ft-root ::-webkit-scrollbar-thumb:hover { background: #505050; }
.ft-root ::-webkit-scrollbar-corner { background: transparent; }

.ft-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.ft-num { font-variant-numeric: tabular-nums; }

.ft-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
  display: inline-block;
}

/* ------------------------------------------------------------------ */
/* Floating trigger                                                    */
/* ------------------------------------------------------------------ */
.ft-trigger {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px 0 8px;
  background: var(--ft-bg);
  color: var(--ft-text);
  border: 1px solid var(--ft-border);
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  font-size: 13px;
  font-weight: 600;
  user-select: none;
  transition: background-color 0.15s, border-color 0.15s, transform 0.15s;
}
.ft-trigger:hover {
  background: var(--ft-surface);
  border-color: var(--ft-control);
  transform: translateY(-1px);
}
.ft-trigger:active { transform: translateY(0); }
.ft-left.ft-trigger, .ft-left.ft-drawer { right: auto; left: 16px; }

.ft-trigger-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ft-muted);
}

.ft-kbd {
  font-family: var(--ft-face);
  font-size: 11px;
  font-weight: 500;
  color: var(--ft-faint);
  background: none;
  border: 0;
  padding: 0;
  white-space: nowrap;
}

/* ------------------------------------------------------------------ */
/* Drawer shell                                                        */
/* ------------------------------------------------------------------ */
.ft-drawer {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483000;
  width: 420px;
  max-width: calc(100vw - 32px);
  height: 680px;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  background: var(--ft-bg);
  border: 1px solid var(--ft-border);
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ftRise 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.ft-drawer:focus { outline: none; }

@keyframes ftRise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.ft-header {
  flex-shrink: 0;
  height: 48px;
  padding: 0 8px 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ft-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.ft-brand-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--ft-faint);
}
.ft-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Buttons */
.ft-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--ft-control-h);
  padding: 0 10px;
  border-radius: var(--ft-radius-control);
  border: 1px solid var(--ft-control);
  background: transparent;
  color: var(--ft-text);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.12s, border-color 0.12s, color 0.12s;
}
.ft-btn:hover:not(:disabled) { background: var(--ft-active); }
.ft-btn:active:not(:disabled) { transform: translateY(0.5px); }

.ft-btn-primary {
  background: var(--ft-accent);
  border-color: var(--ft-accent);
  color: #ffffff;
  font-weight: 600;
}
.ft-btn-primary:hover:not(:disabled) {
  background: var(--ft-accent-hover);
  border-color: var(--ft-accent-hover);
}

.ft-btn-quiet {
  border-color: transparent;
  color: var(--ft-muted);
}
.ft-btn-quiet:hover:not(:disabled) { color: var(--ft-text); }
.ft-btn-quiet[aria-pressed="true"] {
  background: var(--ft-active);
  color: var(--ft-text);
}

.ft-btn-icon {
  width: var(--ft-control-h);
  padding: 0;
}
.ft-btn-sm { height: 26px; padding: 0 8px; }
.ft-btn-sm.ft-btn-icon { width: 26px; padding: 0; }

/* Tabs */
.ft-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
  padding: 0 6px;
  border-bottom: 1px solid var(--ft-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.ft-tabs::-webkit-scrollbar { display: none; }
.ft-tab {
  position: relative;
  height: 36px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ft-faint);
  white-space: nowrap;
  border-radius: 4px;
  transition: color 0.12s;
}
.ft-tab:hover { color: var(--ft-text); }
.ft-tab[aria-selected="true"] { color: var(--ft-text); }
.ft-tab[aria-selected="true"]::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  background: var(--ft-text);
}
.ft-tab-count {
  font-size: 11px;
  color: var(--ft-faint);
  font-variant-numeric: tabular-nums;
}

/* Panes */
.ft-pane {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.ft-pane-top {
  flex-shrink: 0;
  padding: 12px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ft-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 12px 12px;
}
.ft-scroll-pad { padding-top: 12px; }

.ft-pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 26px;
}
.ft-caption {
  font-size: 12px;
  color: var(--ft-faint);
}
.ft-section-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--ft-muted);
  margin: 16px 0 6px;
}
.ft-section-title:first-child { margin-top: 0; }

/* Footer status bar */
.ft-footer {
  flex-shrink: 0;
  min-height: 52px;
  padding: 8px 12px;
  border-top: 1px solid var(--ft-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ft-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  color: var(--ft-muted);
}
.ft-status-pending { color: var(--ft-pending); }
.ft-status-saved { color: var(--ft-positive); }
.ft-footer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* ------------------------------------------------------------------ */
/* Fonts tab                                                           */
/* ------------------------------------------------------------------ */
.ft-channels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2px;
  padding: 2px;
  background: var(--ft-surface);
  border-radius: var(--ft-radius);
}
.ft-channel {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 7px 10px 8px;
  border-radius: 6px;
  transition: background-color 0.12s;
}
.ft-channel:hover { background: var(--ft-hover); }
.ft-channel[aria-pressed="true"] { background: var(--ft-active); }
.ft-channel-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ft-faint);
  white-space: nowrap;
}
.ft-channel[aria-pressed="true"] .ft-channel-label { color: var(--ft-muted); }
.ft-channel-font {
  font-size: 14px;
  line-height: 1.3;
  color: var(--ft-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ft-channel-font-default { color: var(--ft-faint); }

.ft-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Scrub number fields */
.ft-field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  height: var(--ft-control-h);
  padding: 0 8px;
  background: var(--ft-surface);
  border: 1px solid transparent;
  border-radius: var(--ft-radius-control);
  transition: border-color 0.12s;
}
.ft-field:hover { border-color: var(--ft-border); }
.ft-field:focus-within { border-color: var(--ft-accent); }
.ft-field-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ft-faint);
  cursor: ew-resize;
  user-select: none;
  touch-action: none;
  white-space: nowrap;
  padding-right: 8px;
}
.ft-field-label:hover { color: var(--ft-text); }
.ft-field input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: 0;
  outline: none;
  padding: 0;
  text-align: right;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--ft-text);
  -moz-appearance: textfield;
}
.ft-field input:focus-visible { outline: none; }
.ft-field input::-webkit-outer-spin-button,
.ft-field input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ft-field-unit {
  font-size: 12px;
  color: var(--ft-faint);
  padding-left: 3px;
  user-select: none;
}

/* Search + text inputs */
.ft-search {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.ft-search svg {
  position: absolute;
  left: 9px;
  color: var(--ft-faint);
  pointer-events: none;
}
.ft-input, .ft-select {
  width: 100%;
  height: var(--ft-control-h);
  background: var(--ft-surface);
  border: 1px solid transparent;
  border-radius: var(--ft-radius-control);
  padding: 0 10px;
  color: var(--ft-text);
  font-size: 12px;
  outline: none;
  transition: border-color 0.12s;
}
.ft-input::placeholder { color: var(--ft-faint); opacity: 1; }
.ft-input:hover, .ft-select:hover { border-color: var(--ft-border); }
.ft-input:focus, .ft-select:focus { border-color: var(--ft-accent); outline: none; }
.ft-search .ft-input { padding-left: 30px; padding-right: 28px; }
.ft-search-clear {
  position: absolute;
  right: 4px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--ft-faint);
}
.ft-search-clear svg { position: static; }
.ft-search-clear:hover { color: var(--ft-text); background: var(--ft-active); }

/* Filter chips */
.ft-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.ft-chip {
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--ft-faint);
  white-space: nowrap;
  transition: background-color 0.12s, color 0.12s;
}
.ft-chip:hover { color: var(--ft-text); background: var(--ft-hover); }
.ft-chip[aria-pressed="true"] {
  background: var(--ft-active);
  color: var(--ft-text);
}

/* Font + pairing rows */
.ft-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 6px;
}
.ft-list {
  display: flex;
  flex-direction: column;
}
.ft-item {
  position: relative;
  display: flex;
  align-items: center;
  border-top: 1px solid var(--ft-rule);
}
.ft-item:first-child { border-top-color: transparent; }
.ft-font-row {
  flex: 1;
  min-width: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background-color 0.1s;
}
.ft-font-row:hover { background: var(--ft-hover); }
.ft-font-row[aria-pressed="true"] { background: var(--ft-active); }
.ft-item-selected, .ft-item-selected + .ft-item { border-top-color: transparent; }
.ft-font-name {
  font-size: 17px;
  line-height: 1.3;
  color: var(--ft-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ft-font-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ft-faint);
  white-space: nowrap;
}
.ft-item-action {
  margin: 0 4px 0 2px;
}

.ft-pill {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.ft-pill-applied { background: var(--ft-positive-bg); color: var(--ft-positive); }
.ft-pill-preview { background: var(--ft-pending-bg); color: var(--ft-pending); }

.ft-pairing-row {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 8px 11px;
  border-radius: 6px;
  transition: background-color 0.1s;
}
.ft-pairing-row:hover { background: var(--ft-hover); }
.ft-pairing-row[aria-pressed="true"] { background: var(--ft-active); }
.ft-pairing-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.ft-pairing-heading {
  font-size: 19px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--ft-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ft-pairing-body {
  font-size: 13px;
  line-height: 1.45;
  color: var(--ft-muted);
}
.ft-pairing-meta {
  font-size: 11px;
  color: var(--ft-faint);
}

/* Empty states */
.ft-empty {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ft-muted);
}

/* Import panel */
.ft-import {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--ft-surface);
  border-radius: var(--ft-radius);
}
.ft-import .ft-input, .ft-import .ft-select { background: var(--ft-bg); }
.ft-segments {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--ft-bg);
  border-radius: var(--ft-radius-control);
}
.ft-segment {
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--ft-faint);
}
.ft-segment:hover { color: var(--ft-text); }
.ft-segment[aria-pressed="true"] { background: var(--ft-active); color: var(--ft-text); }
.ft-dropzone {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  text-align: center;
  border: 1px dashed var(--ft-control);
  border-radius: var(--ft-radius-control);
  background: var(--ft-bg);
  font-size: 12px;
  color: var(--ft-text);
  transition: border-color 0.12s, background-color 0.12s;
}
.ft-dropzone:hover, .ft-dropzone-active {
  border-color: var(--ft-accent);
  background: var(--ft-hover);
}
.ft-label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  font-size: 12px;
  color: var(--ft-muted);
}
.ft-import-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 8px;
}
.ft-error {
  font-size: 12px;
  color: var(--ft-negative);
  background: var(--ft-negative-bg);
  border-radius: var(--ft-radius-control);
  padding: 7px 10px;
}

/* ------------------------------------------------------------------ */
/* Saved, Detected, Export                                             */
/* ------------------------------------------------------------------ */
.ft-saved-row {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 6px;
  transition: background-color 0.1s;
}
.ft-saved-row:hover { background: var(--ft-hover); }
.ft-saved-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--ft-faint);
}
.ft-saved-restore { color: var(--ft-muted); }
.ft-saved-row:hover .ft-saved-restore { color: var(--ft-text); }
.ft-saved-fonts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 13px;
}
.ft-saved-font {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ft-saved-font-default { color: var(--ft-faint); }

.ft-kv {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 2px 12px;
  padding: 9px 0;
  border-top: 1px solid var(--ft-rule);
  font-size: 13px;
}
.ft-kv:first-of-type { border-top: 0; }
.ft-kv-key {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: start;
  color: var(--ft-muted);
  min-height: 19px;
}
.ft-kv-value { min-width: 0; overflow-wrap: anywhere; }
.ft-kv-sub {
  grid-column: 2;
  font-family: var(--ft-face-code);
  font-size: 11px;
  color: var(--ft-faint);
  overflow-wrap: anywhere;
}
.ft-mono {
  font-family: var(--ft-face-code);
  font-size: 12px;
}

.ft-code {
  position: relative;
  background: var(--ft-code-bg);
  border: 1px solid var(--ft-border);
  border-radius: var(--ft-radius);
  margin-top: 8px;
}
.ft-code pre {
  margin: 0;
  padding: 12px;
  padding-right: 76px;
  overflow-x: auto;
  background: none;
  border: 0;
  border-radius: 0;
  font-family: var(--ft-face-code) !important;
  font-size: 12px !important;
  line-height: 1.6;
  color: #e6e6e6;
  white-space: pre;
  tab-size: 2;
}
.ft-code-copy {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--ft-surface);
  border-color: var(--ft-border);
}

/* ------------------------------------------------------------------ */
/* Small screens: a bottom sheet that leaves the page visible above    */
/* ------------------------------------------------------------------ */
@media (max-width: 520px) {
  .ft-drawer, .ft-left.ft-drawer {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    max-width: none;
    height: 68vh;
    height: 68dvh;
    max-height: calc(100dvh - 16px);
  }
  .ft-trigger { bottom: 12px; right: 12px; }
  .ft-left.ft-trigger { left: 12px; }
  .ft-hide-narrow { display: none; }
  .ft-header .ft-btn-quiet { width: var(--ft-control-h); padding: 0; }
  .ft-font-row { min-height: 48px; }
  .ft-input, .ft-select, .ft-field input { font-size: 16px; }
}

/* Short windows: let the whole Fonts pane scroll instead of pinning its top */
@media (max-height: 560px) {
  .ft-pane-fonts { overflow-y: auto; overscroll-behavior: contain; }
  .ft-pane-fonts .ft-scroll { flex: none; overflow: visible; }
}

@media (prefers-reduced-motion: reduce) {
  .ft-drawer { animation: none; }
  .ft-root * { transition: none !important; }
}
`;

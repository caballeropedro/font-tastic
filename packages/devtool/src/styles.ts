export const DEVTOOL_CSS = `
.ft-root {
  --ft-bg-primary: #0f172a;
  --ft-bg-secondary: #1e293b;
  --ft-bg-card: #182234;
  --ft-bg-hover: #334155;
  --ft-border: #334155;
  --ft-border-subtle: #273549;
  --ft-text-primary: #f8fafc;
  --ft-text-secondary: #94a3b8;
  --ft-text-muted: #64748b;
  --ft-accent: #3b82f6;
  --ft-accent-hover: #2563eb;
  --ft-accent-light: rgba(59, 130, 246, 0.15);
  --ft-success: #10b981;
  --ft-warning: #f59e0b;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 13px !important;
  color: var(--ft-text-primary) !important;
  line-height: 1.5 !important;
  box-sizing: border-box !important;
  z-index: 999999 !important;
}

.ft-root *, .ft-root *::before, .ft-root *::after {
  box-sizing: border-box !important;
}

/* Floating Trigger Button */
.ft-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999998;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #0f172a;
  color: #f8fafc;
  border: 1px solid #334155;
  padding: 8px 14px;
  border-radius: 9999px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.ft-trigger:hover {
  background: #1e293b;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -4px rgba(59, 130, 246, 0.25);
}

.ft-trigger-badge {
  background: #3b82f6;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 999px;
}

/* Drawer Container */
.ft-drawer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 460px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  height: 680px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ftSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes ftSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Drawer Header */
.ft-header {
  padding: 14px 18px;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e293b;
}

.ft-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: -0.01em;
}

.ft-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ft-icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.ft-icon-btn:hover {
  background: #334155;
  color: #f8fafc;
}

/* Framework Tag */
.ft-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Nav Tabs */
.ft-tabs {
  display: flex;
  border-bottom: 1px solid #334155;
  background: #0f172a;
  padding: 4px 8px 0;
  gap: 2px;
  overflow-x: auto;
}

.ft-tab {
  padding: 8px 12px;
  color: #94a3b8;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.15s;
}

.ft-tab:hover {
  color: #f8fafc;
}

.ft-tab.ft-tab-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Content Area */
.ft-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Channel Switcher Pills */
.ft-channel-pills {
  display: flex;
  gap: 6px;
  background: #1e293b;
  padding: 4px;
  border-radius: 8px;
}

.ft-channel-pill {
  flex: 1;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.ft-channel-pill.ft-channel-pill-active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Active Channel Status Card */
.ft-status-card {
  background: #182234;
  border: 1px solid #273549;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ft-status-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ft-status-font-name {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}

/* Sliders */
.ft-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}

.ft-control-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ft-control-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.ft-slider {
  width: 100%;
  accent-color: #3b82f6;
  height: 4px;
  cursor: pointer;
}

/* Search and Filters */
.ft-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.ft-search-input {
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px 8px 34px;
  color: #f8fafc;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}

.ft-search-input:focus {
  border-color: #3b82f6;
}

.ft-search-icon {
  position: absolute;
  left: 10px;
  color: #64748b;
}

.ft-category-chips {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.ft-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #334155;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.ft-chip:hover {
  border-color: #475569;
  color: #f8fafc;
}

.ft-chip.ft-chip-active {
  background: #334155;
  color: #f8fafc;
  border-color: #3b82f6;
}

/* Font List Cards */
.ft-font-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ft-font-card {
  background: #182234;
  border: 1px solid #273549;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ft-font-card:hover {
  border-color: #3b82f6;
  background: #1e293b;
  transform: translateY(-1px);
}

.ft-font-card.ft-font-card-selected {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  box-shadow: 0 0 0 1px #3b82f6;
}

.ft-font-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ft-font-title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
}

.ft-font-preview {
  font-size: 18px;
  color: #f1f5f9;
  padding: 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ft-font-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.ft-mini-tag {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #0f172a;
  color: #94a3b8;
  border: 1px solid #334155;
}

/* Pairings List */
.ft-pairing-card {
  background: #182234;
  border: 1px solid #273549;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.ft-pairing-card:hover {
  border-color: #3b82f6;
  background: #1e293b;
}

.ft-pairing-preview-h {
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
}

.ft-pairing-preview-b {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

/* Export Panel */
.ft-code-block {
  background: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 11px;
  color: #e2e8f0;
  overflow-x: auto;
  position: relative;
  max-height: 220px;
}

.ft-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.ft-copy-btn:hover {
  background: #334155;
  color: #f8fafc;
}
`;

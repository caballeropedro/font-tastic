import { ChannelConfig, ChannelState, TypographyHistoryEntry } from './types';
import { loadGoogleFont } from './loader';

const STYLE_ELEMENT_ID = 'font-tastic-runtime-overrides';
const HIGHLIGHT_STYLE_ELEMENT_ID = 'font-tastic-group-highlights';

const STORAGE_KEY_APPLIED = 'font-tastic:applied-states';
const STORAGE_KEY_HISTORY = 'font-tastic:history';
const STORAGE_KEY_PREFS = 'font-tastic:preferences';

function isChannelStateEqual(a?: ChannelState, b?: ChannelState): boolean {
  const fontA = a?.selectedFont || null;
  const fontB = b?.selectedFont || null;
  const weightA = a?.selectedWeight || undefined;
  const weightB = b?.selectedWeight || undefined;
  const spacingA = a?.letterSpacing || undefined;
  const spacingB = b?.letterSpacing || undefined;
  const lineA = a?.lineHeight || undefined;
  const lineB = b?.lineHeight || undefined;
  const scaleA = a?.fontSizeScale ?? 1;
  const scaleB = b?.fontSizeScale ?? 1;

  return (
    fontA === fontB &&
    weightA === weightB &&
    spacingA === spacingB &&
    lineA === lineB &&
    scaleA === scaleB
  );
}

function hasChannelCustomization(state?: ChannelState): boolean {
  if (!state) return false;
  return Boolean(
    state.selectedFont ||
      state.selectedWeight ||
      (state.letterSpacing && state.letterSpacing !== '0px' && state.letterSpacing !== 'normal') ||
      state.lineHeight ||
      (state.fontSizeScale && state.fontSizeScale !== 1)
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(59, 130, 246, ${alpha})`;
}

export class FontOverrideManager {
  private channels: Map<string, ChannelConfig> = new Map();
  private states: Map<string, ChannelState> = new Map();
  private appliedStates: Map<string, ChannelState> = new Map();
  private history: TypographyHistoryEntry[] = [];
  private originalCssVars: Map<string, string> = new Map();
  private overridesEnabled: boolean = true;
  private highlightGroups: boolean = false;
  private listeners: Set<(states: Map<string, ChannelState>) => void> = new Set();

  constructor(configs: ChannelConfig[] = []) {
    this.initChannels(configs);
    this.loadFromStorage();
  }

  public initChannels(configs: ChannelConfig[]): void {
    for (const config of configs) {
      this.channels.set(config.id, config);
      if (!this.states.has(config.id)) {
        const initial: ChannelState = {
          channelId: config.id,
          selectedFont: null
        };
        this.states.set(config.id, { ...initial });
        this.appliedStates.set(config.id, { ...initial });
      }

      // Remember original CSS variable value if present
      const targetVar = config.targetVar || config.fallbackVar;
      if (typeof window !== 'undefined' && targetVar && !this.originalCssVars.has(targetVar)) {
        const val = window.getComputedStyle(document.documentElement).getPropertyValue(targetVar).trim();
        this.originalCssVars.set(targetVar, val);
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const prefsRaw = window.localStorage.getItem(STORAGE_KEY_PREFS);
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw);
        if (typeof prefs.overridesEnabled === 'boolean') {
          this.overridesEnabled = prefs.overridesEnabled;
        }
        if (typeof prefs.highlightGroups === 'boolean') {
          this.highlightGroups = prefs.highlightGroups;
        }
      }

      const historyRaw = window.localStorage.getItem(STORAGE_KEY_HISTORY);
      if (historyRaw) {
        const parsedHistory = JSON.parse(historyRaw);
        if (Array.isArray(parsedHistory)) {
          this.history = parsedHistory;
        }
      }

      const appliedRaw = window.localStorage.getItem(STORAGE_KEY_APPLIED);
      if (appliedRaw) {
        const parsedApplied = JSON.parse(appliedRaw) as Record<string, ChannelState>;
        for (const [channelId, state] of Object.entries(parsedApplied)) {
          if (this.channels.has(channelId) && state) {
            this.appliedStates.set(channelId, { ...state, channelId });
            this.states.set(channelId, { ...state, channelId });
            if (state.selectedFont) {
              loadGoogleFont(state.selectedFont);
            }
          }
        }
      }
    } catch {
      // Ignore storage access or parse errors
    }

    this.syncCssVariables();
    this.rebuildStyleElement();
    this.rebuildHighlightStyleElement();
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const appliedObj: Record<string, ChannelState> = {};
      for (const [id, st] of this.appliedStates.entries()) {
        appliedObj[id] = st;
      }
      window.localStorage.setItem(STORAGE_KEY_APPLIED, JSON.stringify(appliedObj));
      window.localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
      window.localStorage.setItem(
        STORAGE_KEY_PREFS,
        JSON.stringify({
          overridesEnabled: this.overridesEnabled,
          highlightGroups: this.highlightGroups
        })
      );
    } catch {
      // Ignore storage quota / security errors
    }
  }

  public async applyFont(
    channelId: string,
    fontFamily: string,
    options?: {
      weight?: string;
      letterSpacing?: string;
      lineHeight?: string;
      fontSizeScale?: number;
    }
  ): Promise<void> {
    const config = this.channels.get(channelId);
    if (!config) return;

    // 1. Ensure font is dynamically loaded
    await loadGoogleFont(fontFamily);

    // 2. Update live preview state
    const currentState = this.states.get(channelId) || { channelId, selectedFont: null };
    const newState: ChannelState = {
      ...currentState,
      selectedFont: fontFamily,
      selectedWeight: options?.weight ?? currentState.selectedWeight,
      letterSpacing: options?.letterSpacing ?? currentState.letterSpacing,
      lineHeight: options?.lineHeight ?? currentState.lineHeight,
      fontSizeScale: options?.fontSizeScale ?? currentState.fontSizeScale
    };
    this.states.set(channelId, newState);

    // Ensure master toggle is enabled when actively previewing a font
    if (!this.overridesEnabled) {
      this.overridesEnabled = true;
    }

    // 3. Sync CSS variables and runtime style overrides element
    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public updateTypographyParams(
    channelId: string,
    params: Partial<Omit<ChannelState, 'channelId' | 'selectedFont'>>
  ): void {
    const currentState = this.states.get(channelId);
    if (!currentState) return;

    this.states.set(channelId, {
      ...currentState,
      ...params
    });

    if (!this.overridesEnabled) {
      this.overridesEnabled = true;
    }

    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  /**
   * Commits the current live preview options as the applied state,
   * saves to localStorage, and records an entry in history.
   */
  public applySelectedOptions(customLabel?: string): TypographyHistoryEntry | null {
    const snapshot: Record<string, ChannelState> = {};
    const labelParts: string[] = [];

    for (const [id, st] of this.states.entries()) {
      const cloned: ChannelState = { ...st };
      this.appliedStates.set(id, cloned);
      snapshot[id] = cloned;

      if (cloned.selectedFont) {
        const shortName = id === 'heading' ? 'H' : id === 'body' ? 'B' : id === 'mono' ? 'M' : id;
        labelParts.push(`${shortName}: ${cloned.selectedFont}`);
      } else if (hasChannelCustomization(cloned)) {
        const shortName = id === 'heading' ? 'H' : id === 'body' ? 'B' : id === 'mono' ? 'M' : id;
        labelParts.push(`${shortName}: Custom`);
      }
    }

    const entry: TypographyHistoryEntry = {
      id: `ft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      label: customLabel || (labelParts.length > 0 ? labelParts.join(' · ') : 'Project Defaults'),
      channels: snapshot
    };

    this.history = [entry, ...this.history].slice(0, 20);
    this.saveToStorage();
    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
    return entry;
  }

  /**
   * Discards unapplied preview changes and reverts to the last applied state.
   */
  public cancelPendingChanges(): void {
    for (const [id, applied] of this.appliedStates.entries()) {
      this.states.set(id, { ...applied });
    }

    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  /**
   * Checks whether there are any unapplied preview changes compared to the last applied state.
   */
  public hasPendingChanges(): boolean {
    for (const id of this.channels.keys()) {
      const current = this.states.get(id);
      const applied = this.appliedStates.get(id);
      if (!isChannelStateEqual(current, applied)) {
        return true;
      }
    }
    return false;
  }

  public getAppliedStates(): Map<string, ChannelState> {
    return new Map(this.appliedStates);
  }

  public getHistory(): TypographyHistoryEntry[] {
    return [...this.history];
  }

  public async restoreHistoryEntry(entryId: string): Promise<void> {
    const entry = this.history.find((h) => h.id === entryId);
    if (!entry) return;

    const fontPromises: Promise<unknown>[] = [];
    for (const [id, st] of Object.entries(entry.channels)) {
      if (this.channels.has(id)) {
        this.states.set(id, { ...st, channelId: id });
        this.appliedStates.set(id, { ...st, channelId: id });
        if (st.selectedFont) {
          fontPromises.push(loadGoogleFont(st.selectedFont));
        }
      }
    }

    await Promise.all(fontPromises);
    this.overridesEnabled = true;
    this.saveToStorage();
    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public clearHistory(): void {
    this.history = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  public setOverridesEnabled(enabled: boolean): void {
    this.overridesEnabled = enabled;
    this.saveToStorage();
    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public isOverridesEnabled(): boolean {
    return this.overridesEnabled;
  }

  public setHighlightGroups(enabled: boolean): void {
    this.highlightGroups = enabled;
    this.saveToStorage();
    this.rebuildHighlightStyleElement();
    this.notifyListeners();
  }

  public isHighlightGroupsEnabled(): boolean {
    return this.highlightGroups;
  }

  public resetChannel(channelId: string): void {
    const config = this.channels.get(channelId);
    if (!config) return;

    this.states.set(channelId, {
      channelId,
      selectedFont: null
    });

    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public resetAll(): void {
    for (const channelId of this.channels.keys()) {
      const cleanState: ChannelState = {
        channelId,
        selectedFont: null
      };
      this.states.set(channelId, { ...cleanState });
      this.appliedStates.set(channelId, { ...cleanState });
    }

    this.saveToStorage();
    this.syncCssVariables();
    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public getState(channelId: string): ChannelState | undefined {
    return this.states.get(channelId);
  }

  public getAllStates(): Map<string, ChannelState> {
    return new Map(this.states);
  }

  public getChannels(): ChannelConfig[] {
    return Array.from(this.channels.values());
  }

  public subscribe(listener: (states: Map<string, ChannelState>) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(new Map(this.states));
      } catch (e) {
        console.error('[font-tastic] Listener error:', e);
      }
    }
  }

  private syncCssVariables(): void {
    if (typeof document === 'undefined') return;

    for (const [channelId, config] of this.channels.entries()) {
      const targetVar = config.targetVar || config.fallbackVar;
      if (!targetVar) continue;

      const state = this.states.get(channelId);
      if (this.overridesEnabled && state?.selectedFont) {
        document.documentElement.style.setProperty(targetVar, `"${state.selectedFont}", sans-serif`);
      } else {
        const orig = this.originalCssVars.get(targetVar);
        if (orig) {
          document.documentElement.style.setProperty(targetVar, orig);
        } else {
          document.documentElement.style.removeProperty(targetVar);
        }
      }
    }
  }

  private scopeSelectorsExcludeDevtool(selectorList: string): string {
    return selectorList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (s === 'body' ? 'body' : `${s}:not(.ft-root):not(.ft-root *)`))
      .join(', ');
  }

  private rebuildStyleElement(): void {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }

    if (!this.overridesEnabled) {
      styleEl.textContent = '';
      return;
    }

    let cssRules = '';

    for (const [channelId, state] of this.states.entries()) {
      if (!hasChannelCustomization(state)) continue;

      const config = this.channels.get(channelId);
      if (!config) continue;

      const rawSelector = config.customSelector || config.defaultSelector;
      const selector = this.scopeSelectorsExcludeDevtool(rawSelector);

      let ruleBody = '';

      if (state.selectedFont) {
        ruleBody += `font-family: "${state.selectedFont}", sans-serif !important;`;
      }
      if (state.selectedWeight) {
        ruleBody += ` font-weight: ${state.selectedWeight} !important;`;
      }
      if (state.letterSpacing) {
        ruleBody += ` letter-spacing: ${state.letterSpacing} !important;`;
      }
      if (state.lineHeight) {
        ruleBody += ` line-height: ${state.lineHeight} !important;`;
      }
      if (state.fontSizeScale && state.fontSizeScale !== 1) {
        ruleBody += ` font-size: calc(1em * ${state.fontSizeScale}) !important;`;
      }

      if (ruleBody.trim()) {
        cssRules += `${selector} { ${ruleBody} }\n`;
      }
    }

    styleEl.textContent = cssRules;
  }

  private rebuildHighlightStyleElement(): void {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById(HIGHLIGHT_STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = HIGHLIGHT_STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }

    if (!this.highlightGroups) {
      styleEl.textContent = '';
      return;
    }

    const headingColor = this.channels.get('heading')?.color || '#3b82f6';
    const bodyColor = this.channels.get('body')?.color || '#a855f7';
    const monoColor = this.channels.get('mono')?.color || '#10b981';

    const headingBg = hexToRgba(headingColor, 0.09);
    const bodyBg = hexToRgba(bodyColor, 0.07);
    const monoBg = hexToRgba(monoColor, 0.09);

    const bodyRaw =
      this.channels.get('body')?.highlightSelector ||
      'p, span, button, a, input, li, label, td, th, [data-font="body"]';
    const headingRaw =
      this.channels.get('heading')?.highlightSelector ||
      'h1, h2, h3, h4, h5, h6, .heading, .font-heading, [data-font="heading"]';
    const monoRaw =
      this.channels.get('mono')?.highlightSelector ||
      'code, pre, kbd, samp, .font-mono, [data-font="mono"]';

    const bodySelector = this.scopeSelectorsExcludeDevtool(bodyRaw);
    const headingSelector = this.scopeSelectorsExcludeDevtool(
      `${headingRaw}, h1 span, h2 span, h3 span, h4 span, h5 span, h6 span, .font-heading span`
    );
    const monoSelector = this.scopeSelectorsExcludeDevtool(
      `${monoRaw}, pre span, code span, .font-mono span, .font-mono div`
    );

    const allHighlighted = `${bodySelector}, ${headingSelector}, ${monoSelector}`;

    styleEl.textContent = `
      ${bodySelector} {
        --ft-box-color: ${bodyColor};
        --ft-box-bg: ${bodyBg};
      }
      ${headingSelector} {
        --ft-box-color: ${headingColor};
        --ft-box-bg: ${headingBg};
      }
      ${monoSelector} {
        --ft-box-color: ${monoColor};
        --ft-box-bg: ${monoBg};
      }
      ${allHighlighted} {
        outline: 1.5px dashed var(--ft-box-color) !important;
        outline-offset: 2px !important;
        background-color: var(--ft-box-bg) !important;
        border-radius: 3px;
        transition: outline-color 0.15s ease, background-color 0.15s ease;
      }
      ${allHighlighted
        .split(',')
        .map((s) => `${s.trim()}:hover`)
        .join(', ')} {
        outline-style: solid !important;
        outline-width: 2px !important;
      }
    `;
  }
}

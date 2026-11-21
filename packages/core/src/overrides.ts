import {
  ChannelConfig,
  ChannelState,
  ClassTarget,
  ScopeMode,
  ScopeState,
  ScopeToggleAction,
  TypographyHistoryEntry
} from './types';
import { loadGoogleFont } from './loader';
import {
  classTargetId,
  cssEscape,
  describeElement,
  getElementSelector,
  normalizeClassName,
  withinSelector
} from './targeting';

const STYLE_ELEMENT_ID = 'font-tastic-runtime-overrides';
const HIGHLIGHT_STYLE_ELEMENT_ID = 'font-tastic-group-highlights';

const STORAGE_KEY_APPLIED = 'font-tastic:applied-states';
const STORAGE_KEY_HISTORY = 'font-tastic:history';
const STORAGE_KEY_PREFS = 'font-tastic:preferences';
const STORAGE_KEY_SCOPE = 'font-tastic:scope';
const STORAGE_KEY_CLASS_TARGETS = 'font-tastic:class-targets';

const DEVTOOL_GUARD = ':not(.ft-root):not(.ft-root *):not([data-ft-dynamic]):not([data-ft-dynamic] *)';
const CLASS_TARGET_COLORS = ['#f59e0b', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'];

/** Original computed values of an ignored element, used to undo inherited overrides on it. */
interface OriginalLook {
  fontFamily: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  fontSize: string;
}

function emptyScope(mode: ScopeMode = 'all'): ScopeState {
  return { mode, included: [], excluded: [] };
}

function splitSelectorList(list: string): string[] {
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

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

function safeClosest(el: Element, selector: string): boolean {
  try {
    return Boolean(el.closest(selector));
  } catch {
    return false;
  }
}

function safeQuery(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
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
  private scope: ScopeState = emptyScope();
  private originalLooks: Map<string, OriginalLook> = new Map();
  private listeners: Set<(states: Map<string, ChannelState>) => void> = new Set();

  constructor(configs: ChannelConfig[] = []) {
    this.initChannels(configs);
    this.loadFromStorage();
  }

  private registerClassChannel(className: string): string {
    const id = classTargetId(className);
    if (this.channels.has(id)) return id;
    const index = this.getClassTargets().length;
    this.channels.set(id, {
      id,
      label: `.${className}`,
      description: `Elements with the class "${className}" and everything inside them`,
      defaultSelector: `.${cssEscape(className)}`,
      color: CLASS_TARGET_COLORS[index % CLASS_TARGET_COLORS.length],
      className
    });
    const initial: ChannelState = { channelId: id, selectedFont: null };
    this.states.set(id, { ...initial });
    this.appliedStates.set(id, { ...initial });
    return id;
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

      const scopeRaw = window.localStorage.getItem(STORAGE_KEY_SCOPE);
      if (scopeRaw) {
        const parsedScope = JSON.parse(scopeRaw) as Partial<ScopeState>;
        const isList = (v: unknown) =>
          Array.isArray(v) && v.every((e) => e && typeof e.selector === 'string' && typeof e.label === 'string');
        this.scope = {
          mode: parsedScope.mode === 'only' ? 'only' : 'all',
          included: isList(parsedScope.included) ? parsedScope.included! : [],
          excluded: isList(parsedScope.excluded) ? parsedScope.excluded! : []
        };
      }

      // Class targets must exist before applied states load, so their fonts restore too
      const classesRaw = window.localStorage.getItem(STORAGE_KEY_CLASS_TARGETS);
      if (classesRaw) {
        const parsedClasses = JSON.parse(classesRaw);
        if (Array.isArray(parsedClasses)) {
          for (const name of parsedClasses) {
            const clean = typeof name === 'string' ? normalizeClassName(name) : null;
            if (clean) this.registerClassChannel(clean);
          }
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

    this.render();
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
      window.localStorage.setItem(STORAGE_KEY_SCOPE, JSON.stringify(this.scope));
      window.localStorage.setItem(
        STORAGE_KEY_CLASS_TARGETS,
        JSON.stringify(this.getClassTargets().map((t) => t.className))
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
    this.render();
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

    this.render();
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
        const shortName = this.shortChannelName(id);
        labelParts.push(`${shortName}: ${cloned.selectedFont}`);
      } else if (hasChannelCustomization(cloned)) {
        const shortName = this.shortChannelName(id);
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
    this.render();
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

    this.render();
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
    this.render();
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
    this.render();
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

    this.render();
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
    this.render();
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

  // ---------------------------------------------------------------------------
  // Element scope: choose which parts of the page the overrides touch
  // ---------------------------------------------------------------------------

  public getScope(): ScopeState {
    return {
      mode: this.scope.mode,
      included: [...this.scope.included],
      excluded: [...this.scope.excluded]
    };
  }

  /** Switches between changing the whole page and only the selected elements. */
  public setScopeMode(mode: ScopeMode): void {
    if (this.scope.mode === mode) return;
    // Selections only mean something in 'only' mode, so drop them when going back to the whole page
    this.scope = { mode, included: mode === 'all' ? [] : this.scope.included, excluded: this.scope.excluded };
    this.commitScope();
  }

  /** Overrides apply everywhere again: whole-page mode, nothing ignored. */
  public selectAll(): void {
    this.scope = emptyScope('all');
    this.commitScope();
  }

  /** Overrides apply nowhere until elements are selected. */
  public deselectAll(): void {
    this.scope = emptyScope('only');
    this.commitScope();
  }

  /** What clicking this element in pick mode would do, without changing anything. */
  public getToggleAction(el: Element): ScopeToggleAction {
    const selector = getElementSelector(el);
    if (this.scope.excluded.some((e) => e.selector === selector)) return 'remove';
    if (this.scope.included.some((e) => e.selector === selector)) return 'remove';
    if (this.scope.excluded.some((e) => safeClosest(el, e.selector))) return 'blocked';
    return this.isElementTargeted(el) ? 'exclude' : 'include';
  }

  /**
   * Picks or unpicks an element:
   * - already selected or ignored: removes it from that list
   * - currently changed by the overrides: ignores it (and everything inside it)
   * - currently untouched (only-mode): selects it
   * - inside an ignored area: does nothing ('blocked')
   */
  public toggleElement(el: Element): ScopeToggleAction {
    const action = this.getToggleAction(el);
    const selector = getElementSelector(el);

    if (action === 'blocked') return action;
    if (action === 'remove') {
      this.scope = {
        ...this.scope,
        included: this.scope.included.filter((e) => e.selector !== selector),
        excluded: this.scope.excluded.filter((e) => e.selector !== selector)
      };
    } else {
      const entry = { selector, label: describeElement(el) };
      this.scope =
        action === 'exclude'
          ? { ...this.scope, excluded: [...this.scope.excluded, entry] }
          : { ...this.scope, included: [...this.scope.included, entry] };
    }

    this.commitScope();
    return action;
  }

  /** Removes one entry from the selected or ignored list by its selector. */
  public removeScopedElement(selector: string): void {
    this.scope = {
      ...this.scope,
      included: this.scope.included.filter((e) => e.selector !== selector),
      excluded: this.scope.excluded.filter((e) => e.selector !== selector)
    };
    this.commitScope();
  }

  /** Whether the overrides currently reach this element. */
  public isElementTargeted(el: Element): boolean {
    if (this.scope.excluded.some((e) => safeClosest(el, e.selector))) return false;
    if (this.scope.mode === 'all') return true;
    return this.scope.included.some((e) => safeClosest(el, e.selector));
  }

  private commitScope(): void {
    this.saveToStorage();
    this.render();
    this.notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Class targets: give any CSS class its own font
  // ---------------------------------------------------------------------------

  public getClassTargets(): ClassTarget[] {
    const targets: ClassTarget[] = [];
    for (const config of this.channels.values()) {
      if (config.className) targets.push({ id: config.id, className: config.className });
    }
    return targets;
  }

  /**
   * Adds a class (".card-title" or "card-title") as its own channel and returns its id.
   * Pick a font for it with applyFont(id, family) like any other channel.
   */
  public addClassTarget(input: string): string {
    const className = normalizeClassName(input);
    if (!className) {
      throw new Error('Enter one class name, like .card-title');
    }
    const id = this.registerClassChannel(className);
    this.saveToStorage();
    this.notifyListeners();
    return id;
  }

  public removeClassTarget(id: string): void {
    if (!this.channels.get(id)?.className) return;
    this.channels.delete(id);
    this.states.delete(id);
    this.appliedStates.delete(id);
    this.saveToStorage();
    this.render();
    this.notifyListeners();
  }

  private shortChannelName(id: string): string {
    if (id === 'heading') return 'H';
    if (id === 'body') return 'B';
    if (id === 'mono') return 'M';
    return this.channels.get(id)?.label || id;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /** Rebuilds everything the overrides put on the page: CSS variables and the runtime style rules. */
  private render(): void {
    if (typeof document === 'undefined') return;

    const styleEl = this.ensureStyleElement();
    const needsCapture = this.scope.excluded.some((e) => !this.originalLooks.has(e.selector));
    if (needsCapture) {
      // Read ignored elements' original look with every override removed
      styleEl.textContent = '';
      this.restoreRootVariables();
      this.captureOriginalLooks();
    }

    this.syncCssVariables();
    styleEl.textContent = this.overridesEnabled ? this.buildOverrideCss() : '';
  }

  private ensureStyleElement(): HTMLStyleElement {
    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    return styleEl;
  }

  private captureOriginalLooks(): void {
    for (const entry of this.scope.excluded) {
      if (this.originalLooks.has(entry.selector)) continue;
      const el = safeQuery(entry.selector);
      if (!el) continue;
      const cs = window.getComputedStyle(el);
      this.originalLooks.set(entry.selector, {
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
        fontSize: cs.fontSize
      });
    }
  }

  private restoreRootVariables(): void {
    for (const config of this.channels.values()) {
      const targetVar = config.targetVar || config.fallbackVar;
      if (!targetVar) continue;
      const orig = this.originalCssVars.get(targetVar);
      if (orig) {
        document.documentElement.style.setProperty(targetVar, orig);
      } else {
        document.documentElement.style.removeProperty(targetVar);
      }
    }
  }

  private syncCssVariables(): void {
    if (typeof document === 'undefined') return;

    this.restoreRootVariables();
    // In only-mode the variables are set on the selected elements instead of :root
    if (!this.overridesEnabled || this.scope.mode === 'only') return;

    for (const [channelId, config] of this.channels.entries()) {
      const targetVar = config.targetVar || config.fallbackVar;
      const state = this.states.get(channelId);
      if (targetVar && state?.selectedFont) {
        document.documentElement.style.setProperty(targetVar, `"${state.selectedFont}", sans-serif`);
      }
    }
  }

  private scopeSelectorsExcludeDevtool(selectorList: string): string {
    return splitSelectorList(selectorList)
      .map((s) => (s === 'body' ? 'body' : `${s}${DEVTOOL_GUARD}`))
      .join(', ');
  }

  /** The CSS text for the runtime overrides, honoring the element scope and class targets. */
  public buildOverrideCss(): string {
    const { mode, included, excluded } = this.scope;
    const includedSelectors = included.map((e) => e.selector);
    const excludedSelectors = excluded.map((e) => e.selector);
    const notIgnored = excludedSelectors.length > 0 ? `:not(${withinSelector(excludedSelectors)})` : '';
    const insideSelected = includedSelectors.length > 0 ? withinSelector(includedSelectors) : '';
    const builtIns = Array.from(this.channels.values()).filter((c) => !c.className);
    const used = { font: false, weight: false, spacing: false, line: false, size: false };

    const groupRules: string[] = [];
    const classRules: string[] = [];

    for (const [channelId, state] of this.states.entries()) {
      if (!hasChannelCustomization(state)) continue;
      const config = this.channels.get(channelId);
      if (!config) continue;

      let ruleBody = '';
      if (state.selectedFont) {
        ruleBody += `font-family: "${state.selectedFont}", sans-serif !important;`;
        used.font = true;
      }
      if (state.selectedWeight) {
        ruleBody += ` font-weight: ${state.selectedWeight} !important;`;
        used.weight = true;
      }
      if (state.letterSpacing) {
        ruleBody += ` letter-spacing: ${state.letterSpacing} !important;`;
        used.spacing = true;
      }
      if (state.lineHeight) {
        ruleBody += ` line-height: ${state.lineHeight} !important;`;
        used.line = true;
      }
      if (state.fontSizeScale && state.fontSizeScale !== 1) {
        ruleBody += ` font-size: calc(1em * ${state.fontSizeScale}) !important;`;
        used.size = true;
      }
      if (!ruleBody.trim()) continue;

      const rawSelector = config.customSelector || config.defaultSelector;

      // Class targets: the class and everything inside it; ignored areas still win
      if (config.className) {
        const selector = [rawSelector, `${rawSelector} *`]
          .map((s) => `${s}${DEVTOOL_GUARD}${notIgnored}`)
          .join(', ');
        classRules.push(`${selector} { ${ruleBody} }`);
        continue;
      }

      const parts = splitSelectorList(rawSelector);

      if (mode === 'all') {
        const selector = parts
          .map((s) => (s === 'body' ? `body${notIgnored}` : `${s}${DEVTOOL_GUARD}${notIgnored}`))
          .join(', ');
        groupRules.push(`${selector} { ${ruleBody} }`);
        continue;
      }

      // Only-mode: nothing selected means nothing changes
      if (!insideSelected) continue;
      const scoped = parts
        .filter((s) => s !== 'body')
        .map((s) => `${s}${DEVTOOL_GUARD}${insideSelected}${notIgnored}`);
      if (parts.includes('body')) {
        // The channel that normally reaches text through inheritance from <body>
        // applies to the selected elements themselves, unless another group owns them
        const otherGroups = builtIns
          .filter((c) => c.id !== channelId)
          .flatMap((c) => splitSelectorList(c.customSelector || c.defaultSelector))
          .filter((s) => s !== 'body');
        const notOther = otherGroups.length > 0 ? `:not(:is(${otherGroups.join(', ')}))` : '';
        scoped.unshift(`:is(${includedSelectors.join(', ')})${DEVTOOL_GUARD}${notOther}${notIgnored}`);
      }
      if (scoped.length > 0) groupRules.push(`${scoped.join(', ')} { ${ruleBody} }`);
    }

    const varRules: string[] = [];
    if (mode === 'only' && includedSelectors.length > 0) {
      const declarations = builtIns
        .map((c) => {
          const targetVar = c.targetVar || c.fallbackVar;
          const font = this.states.get(c.id)?.selectedFont;
          return targetVar && font ? `${targetVar}: "${font}", sans-serif !important;` : '';
        })
        .filter(Boolean);
      if (declarations.length > 0) {
        varRules.push(`:is(${includedSelectors.join(', ')}) { ${declarations.join(' ')} }`);
      }
    }

    // Ignored elements get their original look back, so they don't inherit an override
    const restoreRules: string[] = [];
    for (const selector of excludedSelectors) {
      const look = this.originalLooks.get(selector);
      const declarations: string[] = [];
      if (look) {
        if (used.font && look.fontFamily) declarations.push(`font-family: ${look.fontFamily} !important;`);
        if (used.weight && look.fontWeight) declarations.push(`font-weight: ${look.fontWeight} !important;`);
        if (used.spacing && look.letterSpacing) declarations.push(`letter-spacing: ${look.letterSpacing} !important;`);
        if (used.line && look.lineHeight) declarations.push(`line-height: ${look.lineHeight} !important;`);
        if (used.size && look.fontSize) declarations.push(`font-size: ${look.fontSize} !important;`);
      }
      for (const c of builtIns) {
        const targetVar = c.targetVar || c.fallbackVar;
        const orig = targetVar ? this.originalCssVars.get(targetVar) : '';
        if (targetVar && orig && this.states.get(c.id)?.selectedFont) {
          declarations.push(`${targetVar}: ${orig} !important;`);
        }
      }
      if (declarations.length > 0) restoreRules.push(`${selector} { ${declarations.join(' ')} }`);
    }

    return [...varRules, ...groupRules, ...classRules, ...restoreRules].map((r) => `${r}\n`).join('');
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

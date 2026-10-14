import { ChannelConfig, ChannelState } from './types';
import { loadGoogleFont } from './loader';

const STYLE_ELEMENT_ID = 'font-tastic-runtime-overrides';

export class FontOverrideManager {
  private channels: Map<string, ChannelConfig> = new Map();
  private states: Map<string, ChannelState> = new Map();
  private originalCssVars: Map<string, string> = new Map();
  private listeners: Set<(states: Map<string, ChannelState>) => void> = new Set();

  constructor(configs: ChannelConfig[] = []) {
    this.initChannels(configs);
  }

  public initChannels(configs: ChannelConfig[]): void {
    for (const config of configs) {
      this.channels.set(config.id, config);
      if (!this.states.has(config.id)) {
        this.states.set(config.id, {
          channelId: config.id,
          selectedFont: null
        });
      }

      // Remember original CSS variable value if present
      const targetVar = config.targetVar || config.fallbackVar;
      if (typeof window !== 'undefined' && targetVar && !this.originalCssVars.has(targetVar)) {
        const val = window.getComputedStyle(document.documentElement).getPropertyValue(targetVar).trim();
        this.originalCssVars.set(targetVar, val);
      }
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

    // 2. Update state
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

    // 3. Update CSS variable on :root if configured
    const targetVar = config.targetVar || config.fallbackVar;
    if (typeof document !== 'undefined' && targetVar) {
      document.documentElement.style.setProperty(targetVar, `"${fontFamily}", sans-serif`);
    }

    // 4. Update runtime style overrides element
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

    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public resetChannel(channelId: string): void {
    const config = this.channels.get(channelId);
    if (!config) return;

    this.states.set(channelId, {
      channelId,
      selectedFont: null
    });

    // Restore original CSS variable
    const targetVar = config.targetVar || config.fallbackVar;
    if (typeof document !== 'undefined' && targetVar) {
      const orig = this.originalCssVars.get(targetVar);
      if (orig) {
        document.documentElement.style.setProperty(targetVar, orig);
      } else {
        document.documentElement.style.removeProperty(targetVar);
      }
    }

    this.rebuildStyleElement();
    this.notifyListeners();
  }

  public resetAll(): void {
    for (const channelId of this.channels.keys()) {
      this.resetChannel(channelId);
    }
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

  private rebuildStyleElement(): void {
    if (typeof document === 'undefined') return;

    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }

    let cssRules = '';

    for (const [channelId, state] of this.states.entries()) {
      if (!state.selectedFont) continue;

      const config = this.channels.get(channelId);
      if (!config) continue;

      const selector = config.customSelector || config.defaultSelector;
      const font = state.selectedFont;

      let ruleBody = `font-family: "${font}", sans-serif !important;`;

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

      cssRules += `${selector} { ${ruleBody} }\n`;
    }

    styleEl.textContent = cssRules;
  }
}

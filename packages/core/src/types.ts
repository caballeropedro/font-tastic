export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';

export type CustomFontSourceType = 'file' | 'stylesheet' | 'font-url';

export interface FontItem {
  family: string;
  category: FontCategory;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  tags?: string[];
  description?: string;
  popularRank?: number;
  isCustom?: boolean;
  sourceType?: CustomFontSourceType;
  sourceUrl?: string;
  fileName?: string;
  format?: string;
}

export interface CustomFontItem extends FontItem {
  isCustom: true;
  sourceType: CustomFontSourceType;
  sourceUrl: string;
  fileName?: string;
  format?: string;
  addedAt?: number;
}

export type ChannelId = 'heading' | 'body' | 'mono' | string;

export interface ChannelConfig {
  id: ChannelId;
  label: string;
  description: string;
  defaultSelector: string;
  highlightSelector?: string;
  color?: string;
  fallbackVar?: string;
  targetVar?: string;
  customSelector?: string;
  /** Set when this channel targets a CSS class instead of a built-in group. */
  className?: string;
}

export interface ChannelState {
  channelId: ChannelId;
  selectedFont: string | null;
  selectedWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  fontSizeScale?: number;
}

/**
 * Where font overrides apply on the page.
 * - 'all': every matching element, except the ignored ones.
 * - 'only': just the selected elements (and what is inside them), minus the ignored ones.
 */
export type ScopeMode = 'all' | 'only';

export interface ScopedElement {
  /** Selector that points at the element, from getElementSelector(). */
  selector: string;
  /** Human-readable label, e.g. `h2 "Pricing"`. */
  label: string;
}

export interface ScopeState {
  mode: ScopeMode;
  included: ScopedElement[];
  excluded: ScopedElement[];
}

/** What clicking an element in pick mode does to it. */
export type ScopeToggleAction = 'include' | 'exclude' | 'remove' | 'blocked';

export interface ClassTarget {
  /** Channel id, `class:<name>`. */
  id: string;
  className: string;
}

export interface TypographyHistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  channels: Record<string, ChannelState>;
}

export interface DetectedToken {
  name: string; // e.g. '--font-heading', '--font-sans'
  value: string; // e.g. 'Inter, sans-serif'
  source: 'css-var' | 'computed-heading' | 'computed-body' | 'computed-mono';
}

export interface ProjectTypographyState {
  isTailwindDetected: boolean;
  tailwindVersion?: 'v3' | 'v4';
  cssVariables: DetectedToken[];
  computedFonts: {
    heading: string;
    body: string;
    mono: string;
  };
  recommendedChannels: ChannelConfig[];
}

export interface FontPairing {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  tags: string[];
}

export interface ExportSnippetOptions {
  headingFont?: string;
  bodyFont?: string;
  monoFont?: string;
  headingVar?: string;
  bodyVar?: string;
  monoVar?: string;
}

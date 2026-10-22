export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';

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
}

export interface ChannelState {
  channelId: ChannelId;
  selectedFont: string | null;
  selectedWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  fontSizeScale?: number;
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

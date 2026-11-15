import { loadGoogleFont } from '@font-tastic/core';

export interface FontOption {
  family: string;
  note: string;
  fallback: 'sans-serif' | 'serif' | 'monospace';
}

export const DEFAULT_HEADING = 'Hanken Grotesk';
export const DEFAULT_BODY = 'Hanken Grotesk';
export const MONO_FONT = 'JetBrains Mono';

// Every family here ships the 400-700 weights the page uses.
export const HEADING_FONTS: FontOption[] = [
  { family: 'Hanken Grotesk', note: 'Project default', fallback: 'sans-serif' },
  { family: 'Space Grotesk', note: 'Grotesk', fallback: 'sans-serif' },
  { family: 'Playfair Display', note: 'High-contrast serif', fallback: 'serif' },
  { family: 'Syne', note: 'Display', fallback: 'sans-serif' },
  { family: 'Fraunces', note: 'Soft serif', fallback: 'serif' },
  { family: 'Outfit', note: 'Geometric sans', fallback: 'sans-serif' }
];

export const BODY_FONTS: FontOption[] = [
  { family: 'Hanken Grotesk', note: 'Project default', fallback: 'sans-serif' },
  { family: 'Inter', note: 'Interface sans', fallback: 'sans-serif' },
  { family: 'DM Sans', note: 'Geometric sans', fallback: 'sans-serif' },
  { family: 'Figtree', note: 'Friendly sans', fallback: 'sans-serif' },
  { family: 'Lora', note: 'Reading serif', fallback: 'serif' },
  { family: 'Nunito', note: 'Rounded sans', fallback: 'sans-serif' }
];

const WEIGHTS = ['400', '500', '600', '700'];

export const fontStack = (option: FontOption) => `"${option.family}", ${option.fallback}`;

export const findFont = (list: FontOption[], family: string) =>
  list.find((f) => f.family === family) ?? list[0];

export const loadSiteFont = (family: string) => loadGoogleFont(family, WEIGHTS);

export const preloadSiteFonts = () =>
  Promise.all(
    Array.from(new Set([...HEADING_FONTS, ...BODY_FONTS].map((f) => f.family))).map(loadSiteFont)
  );

const STYLE_ID = 'site-font-pick';

/**
 * Re-sets the whole page in the picked faces by overriding the same CSS
 * variables the devtool detects. Defaults remove the override entirely.
 */
export function applySiteFonts(heading: FontOption, body: FontOption) {
  const rules: string[] = [];
  if (heading.family !== DEFAULT_HEADING) {
    rules.push(`--font-heading: ${fontStack(heading)} !important;`);
  }
  if (body.family !== DEFAULT_BODY) {
    rules.push(`--font-body: ${fontStack(body)} !important;`);
  }

  let el = document.getElementById(STYLE_ID);
  if (rules.length === 0) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `:root { ${rules.join(' ')} }`;
}

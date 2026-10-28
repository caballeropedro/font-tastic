import { CustomFontItem, CustomFontSourceType, FontCategory } from './types';

const loadedFonts = new Set<string>();
const CUSTOM_FONTS_STORAGE_KEY = 'font-tastic:custom-fonts';

const customFontsMap = new Map<string, CustomFontItem>();
const customFontListeners = new Set<(fonts: CustomFontItem[]) => void>();
let customFontsHydrated = false;

function normalizeKey(family: string): string {
  return family.toLowerCase().trim();
}

function notifyCustomFontListeners(): void {
  const list = getCustomFonts();
  for (const listener of customFontListeners) {
    try {
      listener(list);
    } catch (e) {
      console.error('[font-tastic] Custom font listener error:', e);
    }
  }
}

function hydrateCustomFontsFromStorage(): void {
  if (customFontsHydrated) return;
  customFontsHydrated = true;

  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const raw = window.localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item.family === 'string' && typeof item.sourceUrl === 'string') {
          customFontsMap.set(normalizeKey(item.family), item as CustomFontItem);
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
}

function saveCustomFontsToStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const all = Array.from(customFontsMap.values());
  try {
    window.localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // If a large base64 data URL exceeds localStorage quota, store URL-based fonts
    // and smaller file fonts that fit while keeping large ones in memory for the session
    try {
      const compact = all.filter((f) => f.sourceType !== 'file' || f.sourceUrl.length < 250_000);
      window.localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Ignore quota errors
    }
  }
}

function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Infers a clean font family name from a font filename (e.g. "ClashDisplay-Bold.woff2" -> "Clash Display").
 */
export function inferFontFamilyFromFilename(filename: string): string {
  const withoutPath = filename.split(/[/\\]/).pop() || filename;
  const withoutExt = withoutPath.replace(/\.(woff2?|ttf|otf|eot)$/i, '');
  const withoutWeight = withoutExt.replace(
    /[-_](regular|bold|italic|light|medium|semibold|demibold|extrabold|ultrabold|black|heavy|thin|hairline|extralight|ultralight|variable|var|vf|book|roman|oblique|normal|[1-9]00)(italic|oblique)?$/i,
    ''
  );
  const spaced = withoutWeight
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return spaced || withoutExt || 'Custom Font';
}

/**
 * Infers font format string for CSS @font-face from filename or URL/MIME.
 */
export function inferFontFormat(filenameOrUrl: string): string | undefined {
  const lower = filenameOrUrl.toLowerCase().split('?')[0].split('#')[0];
  if (lower.endsWith('.woff2') || lower.startsWith('data:font/woff2') || lower.includes('application/font-woff2')) {
    return 'woff2';
  }
  if (lower.endsWith('.woff') || lower.startsWith('data:font/woff') || lower.includes('application/font-woff')) {
    return 'woff';
  }
  if (lower.endsWith('.ttf') || lower.startsWith('data:font/ttf') || lower.startsWith('data:font/truetype')) {
    return 'truetype';
  }
  if (lower.endsWith('.otf') || lower.startsWith('data:font/otf') || lower.startsWith('data:font/opentype')) {
    return 'opentype';
  }
  return undefined;
}

/**
 * Parses a raw URL, <link> tag, or @import rule and extracts URL, sourceType, and inferred font family name.
 */
export function inferFontInfoFromUrl(rawInput: string): {
  cleanUrl: string;
  sourceType: 'stylesheet' | 'font-url';
  inferredFamily?: string;
  format?: string;
} {
  let cleanUrl = rawInput.trim();

  // Extract from <link href="..."> if user pasted HTML snippet
  const hrefMatch = cleanUrl.match(/href=["']([^"']+)["']/i);
  if (hrefMatch && hrefMatch[1]) {
    cleanUrl = hrefMatch[1].trim();
  } else {
    // Extract from @import url("...") if user pasted CSS snippet
    const importMatch = cleanUrl.match(/url\(["']?([^"')]+)["']?\)/i);
    if (importMatch && importMatch[1]) {
      cleanUrl = importMatch[1].trim();
    }
  }

  const format = inferFontFormat(cleanUrl);
  if (format) {
    const cleanPath = cleanUrl.split('?')[0].split('#')[0];
    const lastSegment = decodeURIComponent(cleanPath.split('/').pop() || '');
    const inferredFamily = lastSegment ? inferFontFamilyFromFilename(lastSegment) : undefined;
    return {
      cleanUrl,
      sourceType: 'font-url',
      inferredFamily,
      format
    };
  }

  let inferredFamily: string | undefined;

  try {
    const parsedUrl = new URL(cleanUrl);

    // 1. Google Fonts / Bunny Fonts style: ?family=Font+Name:wght@...
    const familyParam = parsedUrl.searchParams.get('family');
    if (familyParam) {
      const firstFamily = familyParam.split('|')[0].split(':')[0].replace(/\+/g, ' ').trim();
      if (firstFamily) {
        inferredFamily = firstFamily;
      }
    }

    // 2. Fontshare style: ?f[]=clash-display@400,700
    if (!inferredFamily) {
      const fontshareParam = parsedUrl.searchParams.get('f[]') || parsedUrl.searchParams.get('f');
      if (fontshareParam) {
        const rawName = fontshareParam.split('@')[0].replace(/[-_]+/g, ' ').trim();
        if (rawName) {
          inferredFamily = toTitleCase(rawName);
        }
      }
    }

    // 3. CDNFonts style: /css/cabinet-grotesk
    if (!inferredFamily && parsedUrl.hostname.includes('cdnfonts.com')) {
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last !== 'css') {
        inferredFamily = toTitleCase(decodeURIComponent(last).replace(/[-_]+/g, ' '));
      }
    }

    // 4. Generic stylesheet ending in /font-name.css
    if (!inferredFamily) {
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && /\.css$/i.test(last)) {
        const base = last.replace(/\.css$/i, '');
        if (base && !/^(css|css2|style|styles|font|fonts|index|main)$/i.test(base)) {
          inferredFamily = toTitleCase(inferFontFamilyFromFilename(decodeURIComponent(base)));
        }
      }
    }
  } catch {
    // Ignore URL parse error for relative paths
  }

  return {
    cleanUrl,
    sourceType: 'stylesheet',
    inferredFamily
  };
}

/**
 * Loads a custom font into the document via @font-face or <link rel="stylesheet">.
 */
export async function loadCustomFont(font: CustomFontItem): Promise<boolean> {
  if (typeof document === 'undefined') {
    return false;
  }

  const normalizedKey = normalizeKey(font.family);
  customFontsMap.set(normalizedKey, font);

  if (loadedFonts.has(normalizedKey)) {
    return true;
  }

  if (font.sourceType === 'file' || font.sourceType === 'font-url') {
    try {
      const styleSelector = `style[data-font-tastic-custom="${CSS.escape(normalizedKey)}"]`;
      let styleEl = document.querySelector(styleSelector) as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.setAttribute('data-font-tastic-custom', normalizedKey);
        document.head.appendChild(styleEl);
      }

      const formatClause = font.format ? ` format("${font.format}")` : '';
      styleEl.textContent = `
@font-face {
  font-family: "${font.family}";
  src: url("${font.sourceUrl}")${formatClause};
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;

      if (typeof FontFace !== 'undefined' && typeof document.fonts !== 'undefined') {
        try {
          const face = new FontFace(font.family, `url("${font.sourceUrl}")`, {
            weight: '100 900',
            style: 'normal',
            display: 'swap'
          });
          const loadedFace = await face.load();
          document.fonts.add(loadedFace);
        } catch {
          // Even if FontFace constructor fails on some weight descriptors, the @font-face style tag works
        }
      }

      loadedFonts.add(normalizedKey);
      return true;
    } catch (err) {
      console.error(`[font-tastic] Error loading custom font "${font.family}":`, err);
      return false;
    }
  }

  // Stylesheet URL
  return new Promise((resolve) => {
    try {
      const existingLink = document.querySelector(
        `link[data-font-tastic-custom="${CSS.escape(normalizedKey)}"]`
      ) as HTMLLinkElement | null;
      if (existingLink && existingLink.href === font.sourceUrl) {
        loadedFonts.add(normalizedKey);
        resolve(true);
        return;
      }
      if (existingLink) {
        existingLink.remove();
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.sourceUrl;
      link.setAttribute('data-font-tastic-custom', normalizedKey);

      link.onload = () => {
        loadedFonts.add(normalizedKey);
        if (typeof document.fonts !== 'undefined' && document.fonts.load) {
          document.fonts
            .load(`16px "${font.family}"`)
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };

      link.onerror = () => {
        console.warn(`[font-tastic] Failed to load custom stylesheet font: ${font.family} (${font.sourceUrl})`);
        resolve(false);
      };

      document.head.appendChild(link);
    } catch (err) {
      console.error(`[font-tastic] Error loading custom stylesheet font: ${font.family}`, err);
      resolve(false);
    }
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read font file as Data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read font file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Imports a font from a local File (.woff2, .woff, .ttf, .otf), registers it, and loads it into the document.
 */
export async function importFontFromFile(
  file: File,
  options?: {
    family?: string;
    category?: FontCategory;
  }
): Promise<CustomFontItem> {
  hydrateCustomFontsFromStorage();

  const dataUrl = await readFileAsDataUrl(file);
  const family = (options?.family?.trim() || inferFontFamilyFromFilename(file.name)).trim();
  const category: FontCategory = options?.category || 'sans-serif';
  const format = inferFontFormat(file.name) || inferFontFormat(dataUrl);

  const customFont: CustomFontItem = {
    family,
    category,
    variants: ['400', '700'],
    subsets: ['latin'],
    version: 'custom',
    lastModified: new Date().toISOString().slice(0, 10),
    tags: ['Custom', 'Local File', format?.toUpperCase() || 'Font'],
    description: `Imported from local file (${file.name})`,
    isCustom: true,
    sourceType: 'file',
    sourceUrl: dataUrl,
    fileName: file.name,
    format,
    addedAt: Date.now()
  };

  loadedFonts.delete(normalizeKey(family));
  customFontsMap.set(normalizeKey(family), customFont);
  saveCustomFontsToStorage();
  await loadCustomFont(customFont);
  notifyCustomFontListeners();

  return customFont;
}

/**
 * Attempts to fetch a CSS stylesheet URL and extract @font-face font-family name if not already known.
 */
async function tryExtractFontFamilyFromCssUrl(url: string): Promise<string | undefined> {
  if (typeof fetch === 'undefined') return undefined;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const text = await res.text();
    const match = text.match(/@font-face\s*\{[^}]*font-family\s*:\s*['"]?([^;'"]+)['"]?/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch {
    // Ignore CORS or network errors
  }
  return undefined;
}

/**
 * Imports a font from a URL (either a CSS stylesheet URL or a direct .woff2/.woff/.ttf/.otf file URL),
 * registers it, and loads it into the document.
 */
export async function importFontFromUrl(
  rawUrl: string,
  options?: {
    family?: string;
    category?: FontCategory;
    sourceType?: CustomFontSourceType;
  }
): Promise<CustomFontItem> {
  hydrateCustomFontsFromStorage();

  const info = inferFontInfoFromUrl(rawUrl);
  const cleanUrl = info.cleanUrl;
  const sourceType: CustomFontSourceType = options?.sourceType || info.sourceType;

  let family = options?.family?.trim() || info.inferredFamily;
  if (!family && sourceType === 'stylesheet') {
    family = await tryExtractFontFamilyFromCssUrl(cleanUrl);
  }
  if (!family) {
    throw new Error('Could not automatically detect the Font Family name from this URL. Please enter the Font Family name.');
  }

  const category: FontCategory = options?.category || 'sans-serif';

  const customFont: CustomFontItem = {
    family,
    category,
    variants: ['400', '700'],
    subsets: ['latin'],
    version: 'custom',
    lastModified: new Date().toISOString().slice(0, 10),
    tags: ['Custom', sourceType === 'stylesheet' ? 'Stylesheet URL' : 'Font URL'],
    description: `Imported from URL (${cleanUrl})`,
    isCustom: true,
    sourceType,
    sourceUrl: cleanUrl,
    format: info.format,
    addedAt: Date.now()
  };

  loadedFonts.delete(normalizeKey(family));
  customFontsMap.set(normalizeKey(family), customFont);
  saveCustomFontsToStorage();
  const ok = await loadCustomFont(customFont);
  if (!ok) {
    throw new Error(`Failed to load font from URL: ${cleanUrl}`);
  }
  notifyCustomFontListeners();

  return customFont;
}

/**
 * Returns all user-imported custom fonts.
 */
export function getCustomFonts(): CustomFontItem[] {
  hydrateCustomFontsFromStorage();
  return Array.from(customFontsMap.values()).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
}

/**
 * Looks up a registered custom font by family name.
 */
export function getCustomFont(family: string): CustomFontItem | undefined {
  hydrateCustomFontsFromStorage();
  return customFontsMap.get(normalizeKey(family));
}

/**
 * Removes a custom font by family name from registry, DOM, and localStorage.
 */
export function removeCustomFont(family: string): void {
  hydrateCustomFontsFromStorage();
  const normalizedKey = normalizeKey(family);
  customFontsMap.delete(normalizedKey);
  loadedFonts.delete(normalizedKey);
  saveCustomFontsToStorage();

  if (typeof document !== 'undefined') {
    const el = document.querySelector(`[data-font-tastic-custom="${CSS.escape(normalizedKey)}"]`);
    if (el) el.remove();
  }

  notifyCustomFontListeners();
}

/**
 * Subscribes to changes in the custom fonts list.
 */
export function subscribeCustomFonts(listener: (fonts: CustomFontItem[]) => void): () => void {
  customFontListeners.add(listener);
  return () => {
    customFontListeners.delete(listener);
  };
}

/**
 * Dynamically loads a Google Font (or registered Custom Font) by injecting a stylesheet or @font-face in <head>.
 */
export function loadGoogleFont(family: string, weights: string[] = ['400', '600', '700']): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  hydrateCustomFontsFromStorage();
  const normalizedKey = normalizeKey(family);

  const customFont = customFontsMap.get(normalizedKey);
  if (customFont) {
    return loadCustomFont(customFont);
  }

  if (loadedFonts.has(normalizedKey)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    try {
      // Build Google Fonts v2 URL
      const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
      const sortedWeights = Array.from(new Set(weights))
        .map((w) => parseInt(w, 10))
        .filter((w) => !isNaN(w))
        .sort((a, b) => a - b);

      const weightsParam = sortedWeights.length > 0 ? `:wght@${sortedWeights.join(';')}` : '';
      const href = `https://fonts.googleapis.com/css2?family=${encodedFamily}${weightsParam}&display=swap`;

      // Check if link already exists in DOM
      const existingLink = document.querySelector(`link[data-font-tastic="${normalizedKey}"]`);
      if (existingLink) {
        loadedFonts.add(normalizedKey);
        resolve(true);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-font-tastic', normalizedKey);

      link.onload = () => {
        loadedFonts.add(normalizedKey);
        // If Font Loading API is supported, ensure it's ready
        if (typeof document.fonts !== 'undefined' && document.fonts.load) {
          document.fonts
            .load(`16px "${family}"`)
            .then(() => resolve(true))
            .catch(() => resolve(true));
        } else {
          resolve(true);
        }
      };

      link.onerror = () => {
        console.warn(`[font-tastic] Failed to load font: ${family}`);
        resolve(false);
      };

      document.head.appendChild(link);
    } catch (err) {
      console.error(`[font-tastic] Error loading font: ${family}`, err);
      resolve(false);
    }
  });
}

/**
 * Checks if a font has already been injected and loaded by font-tastic.
 */
export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(normalizeKey(family));
}

/**
 * Preloads a list of font families concurrently.
 */
export async function preloadFonts(families: string[]): Promise<void> {
  await Promise.all(families.map((f) => loadGoogleFont(f)));
}

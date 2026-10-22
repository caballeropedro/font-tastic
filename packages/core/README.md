# `@font-tastic/core`

> **Core typography detection, Google Fonts dynamic loading, style override manager, and code export engine for [Font-Tastic](https://github.com/caballeropedro/font-tastic).**

`@font-tastic/core` is a framework-agnostic TypeScript library that powers `@font-tastic/devtool`. Use it directly to build custom typography switchers, theme editors, or design system tooling.

---

## Installation

```bash
pnpm add @font-tastic/core
# or
npm install @font-tastic/core
```

---

## API Reference

### 1. `detectProjectTypography(): ProjectTypographyState`

Scans the current DOM, computed styles, and loaded stylesheets to discover:
- Whether Tailwind CSS (`v3` or `v4` via `@theme`) is active
- Root CSS font variables (`--font-heading`, `--font-body`, `--font-sans`, `--font-mono`, etc.)
- Computed `font-family` stacks on representative `h1`, `body`, and `code` elements
- Recommended `ChannelConfig[]` definitions (`heading`, `body`, `mono`)

```ts
import { detectProjectTypography } from '@font-tastic/core';

const state = detectProjectTypography();
console.log(state.isTailwindDetected, state.tailwindVersion);
console.log(state.cssVariables);
console.log(state.computedFonts);
```

---

### 2. `FontOverrideManager`

Manages live, non-destructive typography overrides across channels by updating `:root` CSS variables and injecting a scoped `<style id="font-tastic-runtime-overrides">` element.

```ts
import { detectProjectTypography, FontOverrideManager } from '@font-tastic/core';

const { recommendedChannels } = detectProjectTypography();
const manager = new FontOverrideManager(recommendedChannels);

// Apply a Google Font to a channel (dynamically loads the font first)
await manager.applyFont('heading', 'Space Grotesk', {
  weight: '700',
  letterSpacing: '-0.5px',
  fontSizeScale: 1.05,
});

// Fine-tune typography parameters without changing the font family
manager.updateTypographyParams('body', {
  letterSpacing: '0.2px',
  fontSizeScale: 1.0,
});

// Subscribe to state changes
const unsubscribe = manager.subscribe((states) => {
  console.log('Active heading font:', states.get('heading')?.selectedFont);
});

// Reset a single channel or restore all project defaults
manager.resetChannel('heading');
manager.resetAll();
```

---

### 3. Dynamic Google Fonts Loader

Load Google Fonts on-demand using the Google Fonts CSS v2 API and `document.fonts` readiness check.

- `loadGoogleFont(family: string, weights?: string[]): Promise<boolean>`
- `isFontLoaded(family: string): boolean`
- `preloadFonts(families: string[]): Promise<void>`

```ts
import { loadGoogleFont, isFontLoaded, preloadFonts } from '@font-tastic/core';

await loadGoogleFont('Plus Jakarta Sans', ['400', '600', '700']);
console.log(isFontLoaded('Plus Jakarta Sans')); // true

await preloadFonts(['Syne', 'Inter', 'JetBrains Mono']);
```

---

### 4. `generateFontExport(options: ExportSnippetOptions)`

Generates ready-to-paste configuration snippets for:
- `htmlHeadSnippet` (Google Fonts `<link>` tags)
- `cssVariablesSnippet` (`:root` variables and element rules)
- `tailwindV3Snippet` (`tailwind.config.js` `fontFamily` extension)
- `tailwindV4Snippet` (Tailwind v4 `@theme` block)
- `fontsourceInstallCmd` & `fontsourceImports` (`@fontsource/*` packages)
- `nextConfigSnippet` (`next/font/google` layout setup)

```ts
import { generateFontExport } from '@font-tastic/core';

const snippets = generateFontExport({
  headingFont: 'Playfair Display',
  bodyFont: 'Source Sans 3',
  monoFont: 'Fira Code',
});

console.log(snippets.tailwindV4Snippet);
```

---

### 5. Built-in Catalog & Curated Pairings

- `GOOGLE_FONTS_CATALOG: FontItem[]` — Curated catalog of popular Google Fonts with categories (`sans-serif`, `serif`, `display`, `monospace`, `handwriting`), variants, and style tags.
- `CURATED_PAIRINGS: FontPairing[]` — Designer-vetted heading + body font combinations.

---

## License

MIT

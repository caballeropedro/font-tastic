<p align="center">
  <img src="./web/public/logo.svg" width="72" height="72" alt="Font-Tastic logo" />
</p>

<h1 align="center">Font-Tastic</h1>

<p align="center">
  <strong>Stop guessing. Just look at it.</strong><br />
  An in-app devtool that swaps fonts on your real UI while you watch,<br />
  applies the ones you pick, and hands you the config.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@font-tastic/devtool"><img src="https://img.shields.io/npm/v/@font-tastic/devtool?color=2563eb&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@font-tastic/devtool"><img src="https://img.shields.io/npm/dm/@font-tastic/devtool?color=2563eb" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-MIT-2563eb" alt="MIT license" />
</p>

<p align="center">
  <a href="https://fontastic.tech">Website and docs</a> ·
  <a href="https://www.npmjs.com/package/@font-tastic/devtool">npm</a> ·
  <a href="#quick-start">Quick start</a>
</p>

<p align="center">
  <img src="./.github/assets/demo.gif" width="800" alt="Font-Tastic demo: picking fonts on a live page, applying them, and copying the config" />
</p>

## Why

Choosing a font usually means guessing. You copy a `<link>` tag, edit a config file, wait for a reload, and only then find out the font does not suit your navigation, your cards or your hero.

Font-Tastic puts the font picker inside your running app, so you judge every font on your own components instead of on a specimen page.

## Features

- **Finds your fonts for you.** Reads `:root` and your stylesheets for font variables (`--font-heading`, `--font-body`, Tailwind's `--font-sans` and `--font-mono`) and detects Tailwind v3 or v4. No configuration.
- **Three independent channels.** Change Headings (`h1` to `h6`), Body & UI, and Code / Mono separately.
- **100+ Google Fonts, plus your own.** Browse the built-in catalog, or import a `.woff2`, `.woff`, `.ttf` or `.otf` from your machine or a URL.
- **Pairings and shuffle.** Apply a curated pairing in one click, or randomize.
- **Fine-tuning.** Adjust letter spacing and size scale live, without touching CSS.
- **Apply or cancel.** Changes are a preview until you press Apply. Applied fonts are saved in your browser, so they stay on across reloads while you work, and every applied set goes into a history you can return to. Cancel puts back what you had.
- **Choose what changes.** In the Targets tab, click elements on your page to ignore them, or switch to *Only selected* and change just the parts you pick. Select all / Deselect all reset it, and selected (green) and ignored (red) elements are highlighted on the page.
- **Fonts by class.** Give any CSS class, like `.card-title`, its own font, spacing and size. It is saved with Apply and included in Export.
- **Group boxes.** Outline every element each channel controls, so you can see what a change affects.
- **One-click export.** Copy the result as an HTML `<link>`, CSS variables, Tailwind v3 config, Tailwind v4 `@theme`, `@fontsource` install commands, or Next.js `next/font`.
- **Development only.** Render it behind a dev check and it never ships to production.

## Quick start

### 1. Install

```bash
pnpm add -D @font-tastic/devtool
# or
npm install -D @font-tastic/devtool
```

Requires React 18 or newer.

### 2. Add it to your app

**Vite / React**

```tsx
import { FontTastic } from '@font-tastic/devtool';

export function App() {
  return (
    <>
      <YourApp />
      {import.meta.env.DEV && <FontTastic />}
    </>
  );
}
```

**Next.js (App Router)**

```tsx
// app/layout.tsx
import { FontTastic } from '@font-tastic/devtool';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <FontTastic />}
      </body>
    </html>
  );
}
```

### 3. Open it

Click the floating Font-Tastic button, or press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd> (<kbd>Cmd</kbd> <kbd>Shift</kbd> <kbd>F</kbd> on macOS).

Pick fonts, press **Apply** to keep them on while you work, then open **Export** and copy the config into your project.

## Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialOpen` | `boolean` | `false` | Whether the drawer starts open. |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Corner for the floating button and drawer. |

## Packages

| Package | Description |
| :--- | :--- |
| [`@font-tastic/devtool`](./packages/devtool) | The React devtool: floating button, drawer, channels, pairings, sliders and export. |
| [`@font-tastic/core`](./packages/core) | The framework-agnostic engine: font catalog, loader, CSS variable scanner, override manager and exporter. Use it to build your own tooling. |
| [`web`](./web) | The website and docs at [fontastic.tech](https://fontastic.tech), with Font-Tastic running on itself. |

## Development

This is a `pnpm` monorepo. You need Node.js 18 or newer and pnpm 9 or newer.

```bash
pnpm install   # install dependencies
pnpm dev       # run the website at http://localhost:3000
pnpm build     # build core, devtool and the website
pnpm test      # run the core unit tests
```

Issues and pull requests are welcome.

## License

MIT © Pedro & The Font-Tastic Open Source Contributors.

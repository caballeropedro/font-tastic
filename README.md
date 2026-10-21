# 🔤 Font-Tastic

> **The open-source typography studio and in-app devtool for modern web projects.**  
> Effortlessly browse, test, and pair Google Fonts live on your real UI components with zero configuration.

---

## ⚡ Why Font-Tastic?

Choosing typography usually means guessing, copying `<link>` stylesheets, editing config files, waiting for reloads, and realizing the font doesn't fit your actual navigation, cards, or hero components.

**Font-Tastic brings Google Fonts directly into your running application:**
- 🔍 **Auto-Detection:** Automatically scans your project's CSS variables (`--font-heading`, `--font-body`, Tailwind's `--font-sans` / `--font-mono`) and computed styles.
- 🎯 **Channel Switching:** Independently preview fonts for **Headings (`h1-h6`)**, **Body & UI (`p`, buttons)**, and **Code (`code`, `pre`)**.
- ✨ **Curated Pairings & Shuffle:** 1-click pairings tested by designers (Modern SaaS, Editorial Luxury, Neo-Brutalist, etc.) plus a randomizer.
- 🎛️ **Typography Fine-Tuning:** Live sliders for letter-spacing and font-scale without touching CSS.
- 🚀 **1-Click Export:** Instantly copy your finalized setup as **Tailwind v3 config**, **Tailwind v4 `@theme`**, **CSS Variables**, **`@fontsource` pnpm commands**, or **Next.js `next/font`**.
- 🛡️ **Zero Bundle Impact in Production:** Plug-and-play development widget.

---

## 📦 Packages in this Monorepo

| Package | Description |
| :--- | :--- |
| [`@font-tastic/core`](./packages/core) | Core engine: Google Fonts catalog, dynamic loader, CSS variable scanner, style override manager, and code exporter. |
| [`@font-tastic/devtool`](./packages/devtool) | React in-app devtool widget with floating trigger badge, drawer, categories, sliders, and export dialog. |
| [`web`](./web) | Official website, documentation, and live playground to test and demonstrate live typography switching. |

---

## 🚀 Quick Start

### 1. Install in your project

```bash
pnpm add -D @font-tastic/devtool
# or
npm install -D @font-tastic/devtool
```

### 2. Add to your root layout / App

```tsx
import { FontTastic } from '@font-tastic/devtool';

export default function App() {
  return (
    <>
      <YourAppComponents />
      {process.env.NODE_ENV === 'development' && <FontTastic />}
    </>
  );
}
```

### 3. Open your app and press `Ctrl + Shift + F`

A sleek floating badge will appear in the bottom corner. Click it or press `Ctrl + Shift + F` (`Cmd + Shift + F` on macOS) to slide out the typography drawer.

---

## 🛠️ Development & Contributing

This project is managed as a `pnpm` monorepo.

### Prerequisites
- Node.js >= 18
- pnpm >= 9

### Install dependencies
```bash
pnpm install
```

### Run the development playground
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build all packages
```bash
pnpm build
```

---

## 📄 License
MIT © Pedro & The Font-Tastic Open Source Contributors.

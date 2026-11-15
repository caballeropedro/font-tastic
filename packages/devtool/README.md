# `@font-tastic/devtool`

> **Floating in-app React typography devtool widget for [Font-Tastic](https://github.com/caballeropedro/font-tastic).**  
> Browse, test, fine-tune, and export Google Fonts live on your real UI components with zero configuration.

---

## Installation

```bash
pnpm add -D @font-tastic/devtool
# or
npm install -D @font-tastic/devtool
```

Peer dependencies: `react >= 18.0.0`, `react-dom >= 18.0.0`.

---

## Quick Usage

### Vite / React

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

### Next.js (App Router)

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

---

## Component Props (`FontTasticProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialOpen` | `boolean` | `false` | Whether the typography drawer starts expanded when mounted. |
| `position` | `'bottom-right' \| 'bottom-left'` | `'bottom-right'` | Screen corner where the floating trigger badge and drawer attach. |

---

## Features & Keyboard Shortcuts

- **Toggle the panel:** `Ctrl + Shift + F` (`Cmd + Shift + F` on macOS) or click the floating **Font-Tastic** pill. `Esc` closes it. The panel remembers whether it was open, and which tab and channel you were on, across reloads.
- **Fonts tab:** Switch between **Headings**, **Body & UI** and **Code**; each channel shows its current font. Press `/` to search, then `↑` / `↓` to walk the list and preview each font on your page. Drag the **Spacing** and **Size** labels to scrub (double-click to reset), filter by category, or **Import** your own font file or URL.
- **Apply or discard:** Every change is a live preview until you press **Apply** in the bar at the bottom of the panel, which saves it in the browser. **Discard** returns to the last applied fonts.
- **Outlines / Original:** **Outlines** marks the text each channel controls; **Original** flips back to your project's fonts to compare.
- **Pairings tab:** Apply curated heading and body pairings with one click, or hit **Shuffle**.
- **Saved tab:** Every applied set is kept so you can restore it later.
- **Detected tab:** The fonts your page uses now, the selectors each channel targets, your `:root` font variables and the Tailwind CSS version (`v3` / `v4`).
- **Export tab:** Copy ready-to-use snippets for **Tailwind v4 (`@theme`)**, **Tailwind v3**, **CSS variables**, **`next/font`** or **`@fontsource`**. The format matching your detected setup is preselected.

---

## License

MIT

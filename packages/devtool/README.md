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

- **Toggle Drawer:** Press `Ctrl + Shift + F` (`Cmd + Shift + F` on macOS) or click the floating **Font-Tastic** pill.
- **Channels Tab:** Switch independently between **Headings (`h1–h6`)**, **Body & UI**, and **Code / Mono**, adjust live **Letter Spacing** and **Scale** sliders, and filter fonts by category or tag.
- **Pairings Tab:** Apply curated designer pairings with 1 click or hit **Randomize**.
- **Detected Setup Tab:** Inspect discovered `:root` CSS variables, computed element font families, and Tailwind CSS version (`v3` / `v4`).
- **Export Tab:** Copy ready-to-use snippets for **Tailwind v3**, **Tailwind v4 (`@theme`)**, **CSS Variables**, **`@fontsource` (pnpm)**, or **Next.js (`next/font/google`)**.

---

## License

MIT

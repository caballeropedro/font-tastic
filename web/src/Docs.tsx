import { useEffect, useState } from 'react';
import { detectProjectTypography, ProjectTypographyState } from '@font-tastic/core';
import { Check, Copy } from 'lucide-react';
import { FontOption } from './fonts';
import { INSTALL_CMD } from './links';

const DOC_SNIPPETS = {
  install: `pnpm add -D @font-tastic/devtool
# or npm install -D @font-tastic/devtool
# or yarn add -D @font-tastic/devtool`,
  reactVite: `import { FontTastic } from '@font-tastic/devtool';

export function App() {
  return (
    <>
      <MainRouter />
      {import.meta.env.DEV && (
        <FontTastic initialOpen={false} position="bottom-right" />
      )}
    </>
  );
}`,
  nextjs: `// app/layout.tsx
import { FontTastic } from '@font-tastic/devtool';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <FontTastic />}
      </body>
    </html>
  );
}`,
  cssVars: `:root {
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Optional data attributes for custom channel targeting */
.hero-display {
  font-family: var(--font-heading);
}`,
  coreApi: `import {
  detectProjectTypography,
  FontOverrideManager,
  loadGoogleFont,
  generateFontExport,
} from '@font-tastic/core';

// 1. Auto-detect CSS variables, Tailwind version & computed fonts
const state = detectProjectTypography();

// 2. Programmatically load & apply Google Fonts to any channel
const manager = new FontOverrideManager(state.recommendedChannels);
await manager.applyFont('heading', 'Syne', {
  letterSpacing: '-0.5px',
  fontSizeScale: 1.05,
});

// 3. Generate framework-ready config snippets
const snippets = generateFontExport({
  headingFont: 'Syne',
  bodyFont: 'Plus Jakarta Sans',
  monoFont: 'JetBrains Mono',
});`
};

const TABS = [
  { id: 'reactVite', label: 'Vite / React' },
  { id: 'nextjs', label: 'Next.js' },
  { id: 'cssVars', label: 'CSS variables' },
  { id: 'coreApi', label: 'Core API' }
] as const;

type TabId = (typeof TABS)[number]['id'];

const firstFamily = (value: string) => value.split(',')[0].trim().replace(/^['"]|['"]$/g, '');

export function Docs({ heading, body }: { heading: FontOption; body: FontOption }) {
  const [tab, setTab] = useState<TabId>('reactVite');
  const [copied, setCopied] = useState<string | null>(null);
  const [detected, setDetected] = useState<ProjectTypographyState | null>(null);

  // Run the real detector on this page, again whenever the picked faces change.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setDetected(detectProjectTypography());
      } catch {
        setDetected(null);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [heading.family, body.family]);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
  };

  const variables = detected
    ? detected.cssVariables
        .filter((v) => v.name.startsWith('--'))
        .filter((v, i, all) => all.findIndex((o) => o.name === v.name) === i)
        .slice(0, 4)
    : [];

  return (
    <section id="docs" className="docs">
      <div className="split">
        <div className="split-say" data-reveal>
          <h2>Install it. Drop it in.</h2>
          <p>
            Add the devtool as a dev dependency and render it once at the root of your app. It
            brings <code>@font-tastic/core</code> with it and stays out of production builds.
          </p>
          <div className="install">
            <code>{INSTALL_CMD}</code>
            <button
              type="button"
              aria-label={copied === 'install' ? 'Install command copied' : 'Copy install command'}
              onClick={() => copy('install', INSTALL_CMD)}
            >
              {copied === 'install' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <div className="split-show ui-frame" data-ui data-reveal>
          <div className="ui-frame-head">
            <div className="ui-seg ui-seg--start" role="group" aria-label="Setup example">
              {TABS.map((t) => (
                <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <pre className="ui-code ui-code--tall">
            <code>{DOC_SNIPPETS[tab]}</code>
          </pre>
          <button type="button" className="ui-copy" onClick={() => copy('snippet', DOC_SNIPPETS[tab])}>
            {copied === 'snippet' ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied === 'snippet' ? 'Copied' : 'Copy snippet'}</span>
          </button>
        </div>
      </div>

      <div className="split">
        <div className="split-say" data-reveal>
          <h3>It finds your fonts for you.</h3>
          <p>
            Font-Tastic reads <code>:root</code> and your stylesheets for font variables, and checks
            whether Tailwind is in use. Changes are a preview until you press Apply, which saves
            them in your browser so they stay on while you work. A reset puts back exactly what you
            had. Open and close it with <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd>, or{' '}
            <kbd>Cmd</kbd> on a Mac.
          </p>
        </div>
        <div className="split-show split-show--narrow ui-frame" data-ui data-reveal>
          <div className="ui-frame-head">
            <span className="ui-dot" style={{ background: '#10b981' }} />
            <span className="ui-frame-title">Detected on this page</span>
          </div>
          {detected ? (
            <dl className="ui-facts">
              <div>
                <dt>Tailwind CSS</dt>
                <dd>
                  {detected.isTailwindDetected
                    ? `Found${detected.tailwindVersion ? `, ${detected.tailwindVersion}` : ''}`
                    : 'Not found'}
                </dd>
              </div>
              {variables.map((v) => (
                <div key={v.name}>
                  <dt>
                    <code>{v.name}</code>
                  </dt>
                  <dd>{firstFamily(v.value)}</dd>
                </div>
              ))}
              <div>
                <dt>Headings render in</dt>
                <dd>{firstFamily(detected.computedFonts.heading)}</dd>
              </div>
              <div>
                <dt>Body renders in</dt>
                <dd>{firstFamily(detected.computedFonts.body)}</dd>
              </div>
            </dl>
          ) : (
            <p className="ui-facts-wait">Scanning this page.</p>
          )}
        </div>
      </div>

      <div className="split">
        <div className="split-say" data-reveal>
          <h3>Two props, three channels.</h3>
          <p>
            The component takes two optional props. Fonts are changed per channel, and each channel
            maps to a CSS variable and a set of elements.
          </p>
        </div>
        <div className="split-show split-tables" data-reveal>
          <table>
            <caption>
              <code>&lt;FontTastic /&gt;</code> props
            </caption>
            <thead>
              <tr>
                <th scope="col">Prop</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <code>initialOpen</code>
                  <span>Start with the drawer open.</span>
                </th>
                <td>
                  <code>boolean</code>
                </td>
                <td>
                  <code>false</code>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>position</code>
                  <span>Corner the trigger and drawer sit in.</span>
                </th>
                <td>
                  <code>'bottom-right' | 'bottom-left'</code>
                </td>
                <td>
                  <code>'bottom-right'</code>
                </td>
              </tr>
            </tbody>
          </table>

          <table>
            <caption>Default channels</caption>
            <thead>
              <tr>
                <th scope="col">Channel</th>
                <th scope="col">Variables</th>
                <th scope="col">Elements</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Headings</th>
                <td>
                  <code>--font-heading, --font-display</code>
                </td>
                <td>
                  <code>h1–h6, .heading, [data-font="heading"]</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Body and UI</th>
                <td>
                  <code>--font-body, --font-sans</code>
                </td>
                <td>
                  <code>body, p, span, button, a, input</code>
                </td>
              </tr>
              <tr>
                <th scope="row">Code</th>
                <td>
                  <code>--font-mono, --font-code</code>
                </td>
                <td>
                  <code>code, pre, kbd, samp, .font-mono</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

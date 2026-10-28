import { ExportSnippetOptions } from './types';
import { getCustomFont } from './loader';

function cleanFontFamilyName(rawFont: string, fallback: string): string {
  if (!rawFont) return fallback;
  const primary = rawFont.split(',')[0]?.trim().replace(/^['"]+|['"]+$/g, '');
  return primary || fallback;
}

/**
 * Generates ready-to-use export snippets for various frameworks and setups.
 */
export function generateFontExport(options: ExportSnippetOptions) {
  const {
    headingFont: rawHeadingFont = 'Space Grotesk',
    bodyFont: rawBodyFont = 'Inter',
    monoFont: rawMonoFont = 'JetBrains Mono',
    headingVar = '--font-heading',
    bodyVar = '--font-body',
    monoVar = '--font-mono'
  } = options;

  const headingFont = cleanFontFamilyName(rawHeadingFont, 'Space Grotesk');
  const bodyFont = cleanFontFamilyName(rawBodyFont, 'Inter');
  const monoFont = cleanFontFamilyName(rawMonoFont, 'JetBrains Mono');

  const fontFamilies = Array.from(new Set([headingFont, bodyFont, monoFont].filter(Boolean)));
  const googleFamilies = fontFamilies.filter((f) => !getCustomFont(f));
  const customFonts = fontFamilies
    .map((f) => getCustomFont(f))
    .filter((f): f is NonNullable<ReturnType<typeof getCustomFont>> => Boolean(f));

  // 1. Google Fonts + Custom Stylesheet HTML Link
  const headLines: string[] = ['<!-- Add to your HTML <head> or RootLayout -->'];
  if (googleFamilies.length > 0) {
    const fontParams = googleFamilies
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
      .join('&');
    const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
    headLines.push(
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      `<link href="${googleFontsUrl}" rel="stylesheet">`
    );
  }
  for (const cf of customFonts) {
    if (cf.sourceType === 'stylesheet') {
      headLines.push(`<link href="${cf.sourceUrl}" rel="stylesheet">`);
    }
  }
  const htmlHeadSnippet = headLines.join('\n');

  // Optional @font-face blocks for custom file / direct font-url fonts
  const customFontFaceBlocks = customFonts
    .filter((cf) => cf.sourceType === 'file' || cf.sourceType === 'font-url')
    .map((cf) => {
      const urlForExport = cf.sourceType === 'file' ? `/fonts/${cf.fileName || `${cf.family.replace(/\s+/g, '-')}.woff2`}` : cf.sourceUrl;
      const formatStr = cf.format ? ` format('${cf.format}')` : '';
      return `@font-face {
  font-family: '${cf.family}';
  src: url('${urlForExport}')${formatStr};
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}\n\n`;
    })
    .join('');

  // 2. CSS Variables
  const cssVariablesSnippet = `${customFontFaceBlocks}:root {
  ${headingVar}: '${headingFont}', sans-serif;
  ${bodyVar}: '${bodyFont}', sans-serif;
  ${monoVar}: '${monoFont}', monospace;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(${headingVar});
}

body, p {
  font-family: var(${bodyVar});
}

code, pre {
  font-family: var(${monoVar});
}`;

  // 3. Tailwind CSS v3 Config
  const tailwindV3Snippet = `// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['"${headingFont}"', 'sans-serif'],
        sans: ['"${bodyFont}"', 'sans-serif'],
        mono: ['"${monoFont}"', 'monospace'],
      },
    },
  },
};`;

  // 4. Tailwind CSS v4 Theme
  const tailwindV4Snippet = `/* In your main CSS file (globals.css / main.css) */
${customFontFaceBlocks}@theme {
  --font-heading: '${headingFont}', sans-serif;
  --font-sans: '${bodyFont}', sans-serif;
  --font-mono: '${monoFont}', monospace;
}`;

  // 5. Fontsource (pnpm) commands and imports
  const fontsourcePkgs = fontFamilies
    .map((f) => `@fontsource/${f.toLowerCase().replace(/\s+/g, '-')}`)
    .join(' ');
  const fontsourceInstallCmd = `pnpm add ${fontsourcePkgs}`;

  const fontsourceImports = fontFamilies
    .map((f) => {
      const slug = f.toLowerCase().replace(/\s+/g, '-');
      return `import '@fontsource/${slug}/400.css';\nimport '@fontsource/${slug}/700.css';`;
    })
    .join('\n');

  // 6. Next.js next/font/google snippet
  const nextImports = fontFamilies.map((f) => f.replace(/\s+/g, '_')).join(', ');
  const nextConfigSnippet = `// app/layout.tsx
import { ${nextImports} } from 'next/font/google';

const headingFont = ${headingFont.replace(/\s+/g, '_')}({
  subsets: ['latin'],
  variable: '${headingVar}',
  weight: ['500', '700'],
});

const bodyFont = ${bodyFont.replace(/\s+/g, '_')}({
  subsets: ['latin'],
  variable: '${bodyVar}',
  weight: ['400', '600'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${headingFont.variable} \${bodyFont.variable}\`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}`;

  return {
    htmlHeadSnippet,
    cssVariablesSnippet,
    tailwindV3Snippet,
    tailwindV4Snippet,
    fontsourceInstallCmd,
    fontsourceImports,
    nextConfigSnippet,
    fonts: {
      heading: headingFont,
      body: bodyFont,
      mono: monoFont
    }
  };
}

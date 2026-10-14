import { ExportSnippetOptions } from './types';

/**
 * Generates ready-to-use export snippets for various frameworks and setups.
 */
export function generateFontExport(options: ExportSnippetOptions) {
  const {
    headingFont = 'Space Grotesk',
    bodyFont = 'Inter',
    monoFont = 'JetBrains Mono',
    headingVar = '--font-heading',
    bodyVar = '--font-body',
    monoVar = '--font-mono'
  } = options;

  const fontFamilies = Array.from(new Set([headingFont, bodyFont, monoFont].filter(Boolean)));

  // 1. Google Fonts HTML Link
  const fontParams = fontFamilies
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`)
    .join('&');
  const googleFontsUrl = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;

  const htmlHeadSnippet = `<!-- Add to your HTML <head> or RootLayout -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${googleFontsUrl}" rel="stylesheet">`;

  // 2. CSS Variables
  const cssVariablesSnippet = `:root {
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
@theme {
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

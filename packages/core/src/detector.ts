import { ChannelConfig, DetectedToken, ProjectTypographyState } from './types';

/**
 * Scans the current DOM and stylesheets to detect project typography configurations,
 * including CSS variables, Tailwind classes, and computed styles.
 */
export function detectProjectTypography(): ProjectTypographyState {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      isTailwindDetected: false,
      cssVariables: [],
      computedFonts: { heading: '', body: '', mono: '' },
      recommendedChannels: getDefaultChannels()
    };
  }

  const detectedVars: Map<string, string> = new Map();
  let hasTailwindIndicators = false;
  let detectedTailwindV4 = false;

  // 1. Scan inline style on root / body
  const rootComputed = window.getComputedStyle(document.documentElement);
  const commonFontVars = [
    '--font-sans',
    '--font-serif',
    '--font-mono',
    '--font-heading',
    '--font-body',
    '--font-display',
    '--font-primary',
    '--font-secondary',
    '--font-code'
  ];

  for (const varName of commonFontVars) {
    const val = rootComputed.getPropertyValue(varName).trim();
    if (val) {
      detectedVars.set(varName, val);
    }
  }

  // 2. Scan stylesheets rules for any --font-* or font-family custom properties
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;

        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];

          // Check if Tailwind is referenced in comments or selectors
          if (rule.cssText && (rule.cssText.includes('--tw-') || rule.cssText.includes('@theme'))) {
            hasTailwindIndicators = true;
            if (rule.cssText.includes('@theme')) {
              detectedTailwindV4 = true;
            }
          }

          if (rule instanceof CSSStyleRule && rule.style) {
            for (let k = 0; k < rule.style.length; k++) {
              const prop = rule.style[k];
              if (
                prop.startsWith('--font-') ||
                prop.includes('-font') ||
                prop === '--font' ||
                prop.startsWith('--fontFamily')
              ) {
                const val = rule.style.getPropertyValue(prop).trim();
                if (val && !detectedVars.has(prop)) {
                  detectedVars.set(prop, val);
                }
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheet access might throw security error, safely ignore
      }
    }
  } catch {
    // Safely ignore stylesheet access errors
  }

  // Check Tailwind DOM classes
  if (!hasTailwindIndicators) {
    const tailwindTestClasses = ['font-sans', 'font-serif', 'font-mono', 'text-sm', 'flex', 'grid'];
    for (const cls of tailwindTestClasses) {
      if (document.querySelector(`.${cls}`)) {
        hasTailwindIndicators = true;
        break;
      }
    }
  }

  // 3. Compute active font families on representative elements
  const computedHeading = getComputedFontForSelector('h1', 'h2, h3, .heading');
  const computedBody = getComputedFontForSelector('body', 'p, span');
  const computedMono = getComputedFontForSelector('code', 'pre, kbd');

  const cssVariables: DetectedToken[] = Array.from(detectedVars.entries()).map(([name, value]) => ({
    name,
    value,
    source: 'css-var'
  }));

  // 4. Construct recommended channels based on detected tokens
  const recommendedChannels: ChannelConfig[] = [];

  // Heading Channel
  const headingVar = detectedVars.has('--font-heading')
    ? '--font-heading'
    : detectedVars.has('--font-display')
    ? '--font-display'
    : detectedVars.has('--font-serif')
    ? '--font-serif'
    : undefined;

  recommendedChannels.push({
    id: 'heading',
    label: 'Headings',
    description: 'Applied to h1, h2, h3, h4, h5, h6 and headline components',
    defaultSelector: 'h1, h2, h3, h4, h5, h6, .heading, .font-heading, [data-font="heading"]',
    highlightSelector: 'h1, h2, h3, h4, h5, h6, .heading, .font-heading, [data-font="heading"]',
    color: '#3b82f6',
    targetVar: headingVar,
    fallbackVar: '--font-heading'
  });

  // Body Channel
  const bodyVar = detectedVars.has('--font-body')
    ? '--font-body'
    : detectedVars.has('--font-sans')
    ? '--font-sans'
    : detectedVars.has('--font-primary')
    ? '--font-primary'
    : undefined;

  recommendedChannels.push({
    id: 'body',
    label: 'Body & UI',
    description: 'Applied to body, paragraphs, buttons, navigation, and general UI',
    defaultSelector: 'body, p, span, button, a, input, li, label, [data-font="body"]',
    highlightSelector: 'p, span, button, a, input, li, label, td, th, [data-font="body"]',
    color: '#a855f7',
    targetVar: bodyVar,
    fallbackVar: '--font-body'
  });

  // Monospace Channel
  const monoVar = detectedVars.has('--font-mono')
    ? '--font-mono'
    : detectedVars.has('--font-code')
    ? '--font-code'
    : undefined;

  recommendedChannels.push({
    id: 'mono',
    label: 'Code & Monospace',
    description: 'Applied to code blocks, inline code, pre, and terminal UI',
    defaultSelector: 'code, pre, kbd, samp, .font-mono, [data-font="mono"]',
    highlightSelector: 'code, pre, kbd, samp, .font-mono, [data-font="mono"]',
    color: '#10b981',
    targetVar: monoVar,
    fallbackVar: '--font-mono'
  });

  return {
    isTailwindDetected: hasTailwindIndicators,
    tailwindVersion: detectedTailwindV4 ? 'v4' : hasTailwindIndicators ? 'v3' : undefined,
    cssVariables,
    computedFonts: {
      heading: computedHeading,
      body: computedBody,
      mono: computedMono
    },
    recommendedChannels
  };
}

function getComputedFontForSelector(primaryTag: string, fallbackSelector: string): string {
  try {
    let el = document.querySelector(primaryTag) as HTMLElement | null;
    let created = false;

    if (!el) {
      el = document.querySelector(fallbackSelector) as HTMLElement | null;
    }

    if (!el) {
      el = document.createElement(primaryTag);
      el.style.visibility = 'hidden';
      el.style.position = 'absolute';
      document.body.appendChild(el);
      created = true;
    }

    const style = window.getComputedStyle(el);
    const font = style.fontFamily;

    if (created && el.parentNode) {
      el.parentNode.removeChild(el);
    }

    return font || 'system-ui, sans-serif';
  } catch {
    return 'system-ui, sans-serif';
  }
}

function getDefaultChannels(): ChannelConfig[] {
  return [
    {
      id: 'heading',
      label: 'Headings',
      description: 'Applied to h1, h2, h3, h4, h5, h6 and headline components',
      defaultSelector: 'h1, h2, h3, h4, h5, h6, .heading, .font-heading',
      highlightSelector: 'h1, h2, h3, h4, h5, h6, .heading, .font-heading',
      color: '#3b82f6',
      targetVar: '--font-heading'
    },
    {
      id: 'body',
      label: 'Body & UI',
      description: 'Applied to body, paragraphs, buttons, navigation, and general UI',
      defaultSelector: 'body, p, span, button, a, input, li, label',
      highlightSelector: 'p, span, button, a, input, li, label, td, th',
      color: '#a855f7',
      targetVar: '--font-body'
    },
    {
      id: 'mono',
      label: 'Code & Monospace',
      description: 'Applied to code blocks, inline code, pre, and terminal UI',
      defaultSelector: 'code, pre, kbd, samp, .font-mono',
      highlightSelector: 'code, pre, kbd, samp, .font-mono',
      color: '#10b981',
      targetVar: '--font-mono'
    }
  ];
}

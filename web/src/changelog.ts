export type ChangeKind = 'new' | 'improved' | 'fixed' | 'docs';

export interface ChangeItem {
  kind: ChangeKind;
  title: string;
  description: string;
}

export interface Release {
  version: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  summary: string;
  changes: ChangeItem[];
}

// Newest first. Add a new entry at the top for every release.
export const RELEASES: Release[] = [
  {
    version: '0.1.2',
    date: '2026-11-14',
    title: 'Bring your own fonts',
    summary:
      'Font-Tastic is no longer limited to Google Fonts. Import any typeface from your machine or a URL and preview it on your real UI alongside the built-in catalog.',
    changes: [
      {
        kind: 'new',
        title: 'Custom font import (local file & URL)',
        description:
          'Load a .woff2, .woff, .ttf or .otf from your computer, or paste a direct font URL or stylesheet link. Imported fonts show up in every channel picker like any other font.'
      },
      {
        kind: 'improved',
        title: 'Exports include your custom fonts',
        description:
          'Generated snippets now emit the matching @font-face blocks (or stylesheet <link> tags) for imported fonts, in both the CSS variables and Tailwind v4 outputs. Google Fonts links only include Google families.'
      },
      {
        kind: 'fixed',
        title: 'Cleaner font names in exports',
        description:
          'Font family names are sanitized before export, so stray quotes and fallback stacks no longer leak into the generated config.'
      },
      {
        kind: 'improved',
        title: 'Dark scrollbars',
        description:
          'The devtool panel and the website now use slim dark scrollbars that match the rest of the interface.'
      },
      {
        kind: 'improved',
        title: 'New animated hero',
        description:
          'The "just look at it." headline cycles through typefaces top-to-bottom, and the hero gets an architectural grid with stat squares.'
      }
    ]
  },
  {
    version: '0.1.1',
    date: '2026-10-22',
    title: 'Apply, cancel, and fine-tune',
    summary:
      'A safer editing workflow: try changes freely, then commit or throw them away. Plus a brand identity, an official website and published npm packages.',
    changes: [
      {
        kind: 'new',
        title: 'Apply / Cancel workflow',
        description:
          'Font changes are staged as a preview first. Apply keeps them, Cancel restores the previous state, and every applied set is saved to a History tab you can return to.'
      },
      {
        kind: 'new',
        title: 'Group highlight boxes',
        description:
          'Turn on Group Boxes to outline every element each channel controls, color-coded for Headings, Body and Code, so you can see exactly what each one affects.'
      },
      {
        kind: 'new',
        title: 'Scrub inputs',
        description:
          'Drag horizontally on numeric fields such as letter spacing and size scale to adjust them smoothly instead of typing values.'
      },
      {
        kind: 'new',
        title: 'Official website & documentation',
        description:
          'The old playground became this site, with install steps, framework examples for Vite and Next.js, a props reference and the channel table.'
      },
      {
        kind: 'new',
        title: 'Editorial Slider Glyph logo',
        description: 'A new logo used across the website and inside the devtool.'
      },
      {
        kind: 'docs',
        title: 'Published to npm',
        description:
          '@font-tastic/core and @font-tastic/devtool are on npm with READMEs for each package.'
      }
    ]
  },
  {
    version: '0.1.0',
    date: '2026-10-14',
    title: 'Initial open-source release',
    summary:
      'The first public version of Font-Tastic: an in-app typography devtool that detects your fonts and lets you swap them live.',
    changes: [
      {
        kind: 'new',
        title: 'Automatic typography detection',
        description:
          'Scans :root and your stylesheets for font CSS variables and detects Tailwind CSS v3 or v4, with no configuration.'
      },
      {
        kind: 'new',
        title: 'Independent channels',
        description:
          'Change Headings, Body & UI and Code / Mono separately, with non-destructive overrides that reset to your original styles.'
      },
      {
        kind: 'new',
        title: 'Google Fonts catalog & pairings',
        description:
          'Browse 100+ built-in Google Fonts, apply curated pairings, or shuffle for a random combination.'
      },
      {
        kind: 'new',
        title: '1-click export',
        description:
          'Copy ready-to-paste config for an HTML <link>, CSS variables, Tailwind v3/v4, @fontsource and Next.js.'
      }
    ]
  }
];

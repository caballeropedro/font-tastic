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
    version: '0.2.1',
    date: '2026-11-21',
    title: 'Choose exactly what changes',
    summary:
      'A new Targets tab lets you decide which parts of the page your fonts touch, and gives any CSS class a font of its own.',
    changes: [
      {
        kind: 'new',
        title: 'Pick elements on the page',
        description:
          'Turn on pick mode and click anything on your page. In Whole page mode a click ignores that element and everything inside it. In Only selected mode a click selects it, and only your selections change.'
      },
      {
        kind: 'new',
        title: 'Select all and Deselect all',
        description:
          'Select all brings fonts back to the whole page. Deselect all starts from nothing, so you can build up just the parts you want.'
      },
      {
        kind: 'new',
        title: 'See what is selected or ignored',
        description:
          'Selected elements are outlined in green and ignored ones in red, right on your page. While picking, a blue box shows what a click will do before you click.'
      },
      {
        kind: 'new',
        title: 'Fonts by class',
        description:
          'Add a class such as .card-title and it becomes its own channel with its own font, spacing and size. Class fonts are saved with Apply and included in Export.'
      },
      {
        kind: 'improved',
        title: 'Tested',
        description: 'The override engine now has unit tests covering element picking, scope modes and class targets.'
      }
    ]
  },
  {
    version: '0.2.0',
    date: '2026-11-15',
    title: 'A faster, calmer panel',
    summary:
      'The devtool panel was redesigned around browsing: more fonts on screen, the keyboard does the previewing, and Apply always sits in the same place.',
    changes: [
      {
        kind: 'improved',
        title: 'Redesigned font list',
        description:
          'Compact rows show each font name set in its own face, so several times more fonts fit on screen. Fonts are fetched only as they scroll into view instead of all at once.'
      },
      {
        kind: 'new',
        title: 'Keyboard browsing',
        description:
          'Press / to search, then use the up and down arrows to walk the list and preview each font on your page. Esc closes the panel.'
      },
      {
        kind: 'improved',
        title: 'Apply bar that stays put',
        description:
          'Apply and Discard now live in a bar at the bottom of the panel with a status line, so starting a preview no longer shifts the layout.'
      },
      {
        kind: 'improved',
        title: 'Channels show their current font',
        description:
          'The Headings, Body & UI and Code switcher displays the font each channel is using. Group Boxes is now Outlines, and the ON/OFF switch is now Original, for comparing with your project fonts.'
      },
      {
        kind: 'new',
        title: 'Remembers where you left it',
        description:
          'The panel keeps its open state, tab and channel across reloads in the same browser tab.'
      },
      {
        kind: 'improved',
        title: 'Works on small screens',
        description:
          'On phones the panel becomes a bottom sheet that leaves your page visible above it.'
      },
      {
        kind: 'improved',
        title: 'Smarter export',
        description:
          'The Export tab preselects the format that matches your detected setup and uses the CSS variable names your project already defines.'
      },
      {
        kind: 'fixed',
        title: 'Spacing and size fields',
        description:
          'Negative letter spacing can be typed directly, dragging works on touch screens, and double-clicking a label resets it.'
      }
    ]
  },
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

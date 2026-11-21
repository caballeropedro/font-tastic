import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/loader', () => ({ loadGoogleFont: vi.fn(() => Promise.resolve(true)) }));

import { FontOverrideManager } from '../src/overrides';
import { getElementSelector } from '../src/targeting';
import type { ChannelConfig } from '../src/types';

const CHANNELS: ChannelConfig[] = [
  {
    id: 'heading',
    label: 'Headings',
    description: '',
    defaultSelector: 'h1, h2, h3',
    targetVar: '--font-heading'
  },
  {
    id: 'body',
    label: 'Body',
    description: '',
    defaultSelector: 'body, p, span',
    targetVar: '--font-body'
  },
  { id: 'mono', label: 'Code', description: '', defaultSelector: 'code, pre' }
];

const runtimeCss = () => document.getElementById('font-tastic-runtime-overrides')?.textContent || '';
const el = (selector: string) => document.querySelector(selector)!;

function setupPage() {
  document.head.innerHTML = '<style>section { font-family: Georgia, serif; }</style>';
  document.documentElement.removeAttribute('style');
  document.body.innerHTML = `
    <header><h1>Font-Tastic</h1><p class="tagline">Try fonts live</p></header>
    <main>
      <section id="features"><h2>Features</h2><p>Fast</p><p class="card-title">Card</p></section>
      <section id="pricing"><h2>Pricing</h2><p>Free</p></section>
    </main>
    <footer><p>Footer</p></footer>`;
}

describe('FontOverrideManager element scope', () => {
  let manager: FontOverrideManager;

  beforeEach(() => {
    localStorage.clear();
    setupPage();
    manager = new FontOverrideManager(CHANNELS);
  });

  it('applies to the whole page by default', async () => {
    await manager.applyFont('heading', 'Lora');
    expect(manager.getScope()).toEqual({ mode: 'all', included: [], excluded: [] });
    expect(runtimeCss()).toContain('h1:not(.ft-root)');
    expect(runtimeCss()).toContain('font-family: "Lora", sans-serif !important;');
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toBe('"Lora", sans-serif');
  });

  it('whole page mode: clicking an element ignores it, clicking again restores it', async () => {
    await manager.applyFont('body', 'Inter');
    const pricing = el('#pricing');

    expect(manager.getToggleAction(pricing)).toBe('exclude');
    expect(manager.toggleElement(pricing)).toBe('exclude');
    expect(manager.getScope().excluded).toEqual([{ selector: '#pricing', label: 'section "Pricing Free"' }]);
    expect(manager.isElementTargeted(pricing)).toBe(false);
    expect(manager.isElementTargeted(el('#pricing p'))).toBe(false);
    expect(manager.isElementTargeted(el('#features p'))).toBe(true);
    expect(runtimeCss()).toContain('p:not(.ft-root):not(.ft-root *):not([data-ft-dynamic]):not([data-ft-dynamic] *):not(:is(#pricing, #pricing *))');
    // The ignored element gets its original font back so it does not inherit from <body>
    expect(runtimeCss()).toContain('#pricing { font-family: Georgia, serif !important; }');

    expect(manager.toggleElement(pricing)).toBe('remove');
    expect(manager.getScope().excluded).toEqual([]);
    expect(manager.isElementTargeted(pricing)).toBe(true);
  });

  it('elements inside an ignored area cannot be picked on their own', () => {
    manager.toggleElement(el('#pricing'));
    expect(manager.getToggleAction(el('#pricing h2'))).toBe('blocked');
    expect(manager.toggleElement(el('#pricing h2'))).toBe('blocked');
    expect(manager.getScope().excluded).toHaveLength(1);
  });

  it('only-selected mode: nothing changes until an element is selected', async () => {
    await manager.applyFont('heading', 'Lora');
    await manager.applyFont('body', 'Inter');
    manager.deselectAll();

    expect(manager.getScope().mode).toBe('only');
    expect(manager.isElementTargeted(el('h1'))).toBe(false);
    expect(runtimeCss()).toBe('');
    // Variables are not set on :root in only-mode
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toBe('');

    expect(manager.toggleElement(el('#features'))).toBe('include');
    expect(manager.isElementTargeted(el('#features h2'))).toBe(true);
    expect(manager.isElementTargeted(el('#pricing h2'))).toBe(false);

    const css = runtimeCss();
    expect(css).toContain('h2:not(.ft-root):not(.ft-root *):not([data-ft-dynamic]):not([data-ft-dynamic] *):is(#features, #features *)');
    // Body text is reached through the selected element itself, not through <body>
    expect(css).not.toMatch(/(^|, )body/m);
    expect(css).toContain(':is(#features):not(.ft-root)');
    expect(css).toContain(':not(:is(h1, h2, h3, code, pre))');
    // Variables move from :root to the selected elements
    expect(css).toContain(':is(#features) { --font-heading: "Lora", sans-serif !important; --font-body: "Inter", sans-serif !important; }');
  });

  it('only-selected mode: a nested element inside a selection can be ignored', () => {
    manager.deselectAll();
    manager.toggleElement(el('#features'));
    const card = el('#features .card-title');
    expect(manager.getToggleAction(card)).toBe('exclude');
    manager.toggleElement(card);
    expect(manager.isElementTargeted(card)).toBe(false);
    expect(manager.isElementTargeted(el('#features h2'))).toBe(true);
  });

  it('select all and deselect all reset the lists', () => {
    manager.toggleElement(el('#pricing'));
    manager.selectAll();
    expect(manager.getScope()).toEqual({ mode: 'all', included: [], excluded: [] });
    manager.deselectAll();
    expect(manager.getScope()).toEqual({ mode: 'only', included: [], excluded: [] });
  });

  it('going back to whole page mode drops the selected elements', () => {
    manager.deselectAll();
    manager.toggleElement(el('#features'));
    manager.setScopeMode('all');
    expect(manager.getScope().included).toEqual([]);
  });

  it('removeScopedElement removes by selector', () => {
    manager.toggleElement(el('#pricing'));
    manager.removeScopedElement('#pricing');
    expect(manager.getScope().excluded).toEqual([]);
  });

  it('remembers the scope across reloads', () => {
    manager.deselectAll();
    manager.toggleElement(el('#features'));
    const reloaded = new FontOverrideManager(CHANNELS);
    expect(reloaded.getScope().mode).toBe('only');
    expect(reloaded.getScope().included.map((e) => e.selector)).toEqual(['#features']);
  });

  it('ignores corrupt stored scope data', () => {
    localStorage.setItem('font-tastic:scope', JSON.stringify({ mode: 'weird', included: [{ nope: 1 }] }));
    const reloaded = new FontOverrideManager(CHANNELS);
    expect(reloaded.getScope()).toEqual({ mode: 'all', included: [], excluded: [] });
  });

  it('picked selectors point back at the same element', () => {
    const footerP = el('footer p');
    manager.toggleElement(footerP);
    const stored = manager.getScope().excluded[0]!.selector;
    expect(stored).toBe(getElementSelector(footerP));
    expect(document.querySelector(stored)).toBe(footerP);
  });

  it('turning overrides off clears the runtime CSS', async () => {
    await manager.applyFont('heading', 'Lora');
    manager.setOverridesEnabled(false);
    expect(runtimeCss()).toBe('');
    expect(document.documentElement.style.getPropertyValue('--font-heading')).toBe('');
  });
});

describe('FontOverrideManager class targets', () => {
  let manager: FontOverrideManager;

  beforeEach(() => {
    localStorage.clear();
    setupPage();
    manager = new FontOverrideManager(CHANNELS);
  });

  it('adds a class as its own channel', () => {
    const id = manager.addClassTarget('.card-title');
    expect(id).toBe('class:card-title');
    expect(manager.getClassTargets()).toEqual([{ id, className: 'card-title' }]);
    const config = manager.getChannels().find((c) => c.id === id)!;
    expect(config.label).toBe('.card-title');
    expect(config.defaultSelector).toBe('.card-title');
    expect(manager.getState(id)?.selectedFont).toBeNull();
  });

  it('adding the same class twice keeps one target', () => {
    manager.addClassTarget('card-title');
    manager.addClassTarget('.card-title');
    expect(manager.getClassTargets()).toHaveLength(1);
  });

  it('rejects invalid class names', () => {
    expect(() => manager.addClassTarget('two classes')).toThrow(/one class name/);
    expect(() => manager.addClassTarget('')).toThrow();
  });

  it('changes the font of the class and everything inside it', async () => {
    const id = manager.addClassTarget('card-title');
    await manager.applyFont(id, 'Playfair Display');
    const css = runtimeCss();
    expect(css).toContain(
      '.card-title:not(.ft-root):not(.ft-root *):not([data-ft-dynamic]):not([data-ft-dynamic] *), .card-title *:not(.ft-root)'
    );
    expect(css).toContain('font-family: "Playfair Display", sans-serif !important;');
    // Class rules come after group rules so they win over the body channel
    await manager.applyFont('body', 'Inter');
    const after = runtimeCss();
    expect(after.indexOf('"Inter"')).toBeLessThan(after.indexOf('"Playfair Display"'));
  });

  it('escapes Tailwind-style class names in the generated CSS', async () => {
    const id = manager.addClassTarget('md:text-lg');
    await manager.applyFont(id, 'Lora');
    expect(runtimeCss()).toContain('.md\\:text-lg');
  });

  it('class targets respect ignored elements', async () => {
    const id = manager.addClassTarget('card-title');
    await manager.applyFont(id, 'Lora');
    manager.toggleElement(el('#features'));
    expect(runtimeCss()).toContain('.card-title *:not(.ft-root):not(.ft-root *):not([data-ft-dynamic]):not([data-ft-dynamic] *):not(:is(#features, #features *))');
  });

  it('survives Apply and reload, including its font', async () => {
    const id = manager.addClassTarget('card-title');
    await manager.applyFont(id, 'Lora');
    expect(manager.hasPendingChanges()).toBe(true);
    const entry = manager.applySelectedOptions();
    expect(entry?.label).toContain('.card-title: Lora');

    const reloaded = new FontOverrideManager(CHANNELS);
    expect(reloaded.getClassTargets()).toEqual([{ id, className: 'card-title' }]);
    expect(reloaded.getState(id)?.selectedFont).toBe('Lora');
    expect(runtimeCss()).toContain('.card-title');
  });

  it('removing a class target removes its rule and its saved state', async () => {
    const id = manager.addClassTarget('card-title');
    await manager.applyFont(id, 'Lora');
    manager.applySelectedOptions();
    manager.removeClassTarget(id);
    expect(manager.getClassTargets()).toEqual([]);
    expect(runtimeCss()).not.toContain('.card-title');
    expect(new FontOverrideManager(CHANNELS).getClassTargets()).toEqual([]);
  });

  it('cannot remove built-in channels through removeClassTarget', () => {
    manager.removeClassTarget('heading');
    expect(manager.getChannels().map((c) => c.id)).toContain('heading');
  });

  it('reset all clears class fonts too', async () => {
    const id = manager.addClassTarget('card-title');
    await manager.applyFont(id, 'Lora');
    manager.resetAll();
    expect(manager.getState(id)?.selectedFont).toBeNull();
    expect(runtimeCss()).toBe('');
  });
});

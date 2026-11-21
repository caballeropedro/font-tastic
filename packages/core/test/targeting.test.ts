import { beforeEach, describe, expect, it } from 'vitest';
import {
  classTargetId,
  cssEscape,
  describeElement,
  getElementSelector,
  normalizeClassName,
  withinSelector
} from '../src/targeting';

describe('getElementSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <section><h2>First</h2><p>One</p><p>Two</p></section>
        <section id="pricing"><div><h3>Plan</h3></div><div><h3>Pro plan</h3></div></section>
      </main>
      <div id="dup"></div><div id="dup"></div>`;
  });

  it('builds a path that matches exactly the picked element', () => {
    const second = document.querySelectorAll('p')[1]!;
    const selector = getElementSelector(second);
    expect(selector).toBe('body > main > section:nth-of-type(1) > p:nth-of-type(2)');
    expect(document.querySelectorAll(selector)).toHaveLength(1);
    expect(document.querySelector(selector)).toBe(second);
  });

  it('anchors on the nearest unique id', () => {
    const pro = document.querySelectorAll('h3')[1]!;
    const selector = getElementSelector(pro);
    expect(selector).toBe('#pricing > div:nth-of-type(2) > h3');
    expect(document.querySelector(selector)).toBe(pro);
  });

  it('does not trust duplicated ids', () => {
    const dup = document.querySelectorAll('#dup')[1]!;
    const selector = getElementSelector(dup);
    expect(selector).not.toContain('#dup');
    expect(document.querySelector(selector)).toBe(dup);
  });

  it('escapes ids with special characters', () => {
    document.body.innerHTML = '<div id=":r1:"><span>x</span></div>';
    const span = document.querySelector('span')!;
    expect(document.querySelector(getElementSelector(span))).toBe(span);
  });
});

describe('describeElement', () => {
  it('uses the tag and a trimmed text snippet', () => {
    document.body.innerHTML = '<h2>  Simple   pricing </h2>';
    expect(describeElement(document.querySelector('h2')!)).toBe('h2 "Simple pricing"');
  });

  it('shortens long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(80)}</p>`;
    expect(describeElement(document.querySelector('p')!)).toMatch(/^p "a{35}…"$/);
  });

  it('falls back to the first class when there is no text', () => {
    document.body.innerHTML = '<div class="hero card"></div>';
    expect(describeElement(document.querySelector('div')!)).toBe('div.hero');
  });
});

describe('class name helpers', () => {
  it('normalizes ".card-title" and "card-title" the same way', () => {
    expect(normalizeClassName('.card-title')).toBe('card-title');
    expect(normalizeClassName('  card-title ')).toBe('card-title');
  });

  it('accepts Tailwind-style class names', () => {
    expect(normalizeClassName('md:text-lg')).toBe('md:text-lg');
  });

  it('rejects empty, multiple or compound class names', () => {
    expect(normalizeClassName('')).toBeNull();
    expect(normalizeClassName('.')).toBeNull();
    expect(normalizeClassName('a b')).toBeNull();
    expect(normalizeClassName('.a.b')).toBeNull();
  });

  it('builds channel ids and escaped selectors', () => {
    expect(classTargetId('card-title')).toBe('class:card-title');
    document.body.innerHTML = '<p class="md:text-lg">x</p>';
    expect(document.querySelector(`.${cssEscape('md:text-lg')}`)).not.toBeNull();
  });

  it('withinSelector matches elements and their descendants', () => {
    expect(withinSelector(['#a', '.b'])).toBe(':is(#a, #a *, .b, .b *)');
  });
});

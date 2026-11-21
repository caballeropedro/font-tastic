/**
 * Helpers for pointing font overrides at specific parts of a page:
 * stable selectors for picked elements and CSS class targets.
 */

/** Escapes a string for use inside a CSS selector (falls back when CSS.escape is unavailable). */
export function cssEscape(value: string): string {
  const native = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape : null;
  if (native) return native(value);
  return value
    .replace(/[^a-zA-Z0-9_ -￿-]/g, (ch) => `\\${ch}`)
    .replace(/^(-?)(\d)/, (_m, dash: string, digit: string) => `${dash}\\3${digit} `);
}

function isUniqueId(el: Element): boolean {
  if (!el.id) return false;
  try {
    return el.ownerDocument.querySelectorAll(`#${cssEscape(el.id)}`).length === 1;
  } catch {
    return false;
  }
}

/**
 * Builds a selector that points at exactly this element, such as
 * `#pricing > div:nth-of-type(2) > h3`. It anchors on the nearest unique id,
 * otherwise walks up to `body` using tag names and :nth-of-type.
 */
export function getElementSelector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;

  while (node) {
    const tag = node.tagName.toLowerCase();
    if (isUniqueId(node)) {
      parts.unshift(`#${cssEscape(node.id)}`);
      break;
    }
    if (tag === 'body' || tag === 'html') {
      parts.unshift(tag);
      break;
    }
    const parent: Element | null = node.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const current: Element = node;
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
    parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(current) + 1})` : tag);
    node = parent;
  }

  return parts.join(' > ');
}

/** A short human label for a picked element, e.g. `h2 "Simple pricing"`. */
export function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();
  // Join text pieces with spaces, so <h2>Pricing</h2><p>Free</p> reads "Pricing Free"
  const pieces: string[] = [];
  const walker = el.ownerDocument.createTreeWalker(el, 4 /* NodeFilter.SHOW_TEXT */);
  let length = 0;
  while (walker.nextNode() && length < 80) {
    const piece = (walker.currentNode.nodeValue || '').trim();
    if (piece) {
      pieces.push(piece);
      length += piece.length;
    }
  }
  const text = pieces.join(' ').replace(/\s+/g, ' ').trim();
  if (text) {
    return `${tag} "${text.length > 36 ? `${text.slice(0, 35)}…` : text}"`;
  }
  const firstClass = el.classList?.[0];
  return firstClass ? `${tag}.${firstClass}` : tag;
}

/**
 * Normalizes user input like ".card-title" or "card-title" to a bare class name.
 * Returns null when the input is not a single class name.
 */
export function normalizeClassName(input: string): string | null {
  const name = input.trim().replace(/^\./, '');
  if (!name || /\s/.test(name) || name.includes('.')) return null;
  return name;
}

/** The channel id used for a class target. */
export function classTargetId(className: string): string {
  return `class:${className}`;
}

/** `:is(a, a *, b, b *)`: matches the given elements and everything inside them. */
export function withinSelector(selectors: string[]): string {
  return `:is(${selectors.flatMap((s) => [s, `${s} *`]).join(', ')})`;
}

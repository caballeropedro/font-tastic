import React, { useEffect, useRef, useState } from 'react';
import { describeElement, FontOverrideManager, ScopeState, ScopeToggleAction } from '@font-tastic/core';

interface MarkBox {
  key: string;
  kind: 'selected' | 'ignored' | 'hover';
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ScopeOverlayProps {
  manager: FontOverrideManager | null;
  scope: ScopeState;
  /** Click-to-pick mode: hovering highlights elements, clicking selects or ignores them. */
  picking: boolean;
  /** Outline the selected and ignored elements on the page. */
  showMarks: boolean;
  /** Selector of a list entry the user is hovering in the panel. */
  focusSelector?: string | null;
  onStopPicking: () => void;
  onPicked: (action: ScopeToggleAction, label: string) => void;
}

const HOVER_HINTS: Record<ScopeToggleAction, string> = {
  exclude: 'Click to ignore',
  include: 'Click to select',
  remove: 'Click to unpick',
  blocked: 'Inside an ignored area'
};

function isDevtoolElement(el: Element): boolean {
  return Boolean(el.closest('.ft-root, [data-ft-dynamic]'));
}

function queryAll(selector: string): Element[] {
  try {
    return Array.from(document.querySelectorAll(selector));
  } catch {
    return [];
  }
}

function toBox(key: string, kind: MarkBox['kind'], label: string, el: Element): MarkBox | null {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { key, kind, label, top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/**
 * Draws selected (green) and ignored (red) elements on top of the page, and runs pick mode.
 * Boxes live in an overlay so the page's own styles are never touched.
 */
export function ScopeOverlay({
  manager,
  scope,
  picking,
  showMarks,
  focusSelector,
  onStopPicking,
  onPicked
}: ScopeOverlayProps) {
  const [boxes, setBoxes] = useState<MarkBox[]>([]);
  const hoverRef = useRef<Element | null>(null);
  const lastSignature = useRef('');

  // Pick mode: intercept page clicks before the app sees them
  useEffect(() => {
    if (!picking || !manager) return;
    document.documentElement.classList.add('ft-picking');

    const pageTarget = (e: Event): Element | null => {
      const target = e.target;
      if (!(target instanceof Element) || isDevtoolElement(target)) return null;
      if (target === document.documentElement) return null;
      return target;
    };

    const onMove = (e: MouseEvent) => {
      hoverRef.current = pageTarget(e);
    };
    const swallow = (e: Event) => {
      if (!pageTarget(e)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onClick = (e: MouseEvent) => {
      const el = pageTarget(e);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const action = manager.toggleElement(el);
      onPicked(action, describeElement(el));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onStopPicking();
    };
    const onLeave = () => {
      hoverRef.current = null;
    };

    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mousedown', swallow, true);
    window.addEventListener('pointerdown', swallow, true);
    window.addEventListener('mouseup', swallow, true);
    window.addEventListener('auxclick', swallow, true);
    window.addEventListener('submit', swallow, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      document.documentElement.classList.remove('ft-picking');
      hoverRef.current = null;
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mousedown', swallow, true);
      window.removeEventListener('pointerdown', swallow, true);
      window.removeEventListener('mouseup', swallow, true);
      window.removeEventListener('auxclick', swallow, true);
      window.removeEventListener('submit', swallow, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [picking, manager, onPicked, onStopPicking]);

  // Follow the marked elements as the page scrolls, resizes or reflows with new fonts
  const active = picking || showMarks || Boolean(focusSelector);
  useEffect(() => {
    if (!active) {
      lastSignature.current = '';
      setBoxes([]);
      return;
    }

    let frame = 0;
    const tick = () => {
      const next: MarkBox[] = [];
      const visibleMarks = showMarks || picking;
      const add = (entries: ScopeState['included'], kind: 'selected' | 'ignored') => {
        for (const entry of entries) {
          if (!visibleMarks && entry.selector !== focusSelector) continue;
          queryAll(entry.selector).forEach((el, i) => {
            if (isDevtoolElement(el)) return;
            const box = toBox(`${kind}:${entry.selector}:${i}`, kind, kind === 'selected' ? 'Selected' : 'Ignored', el);
            if (box) next.push(box);
          });
        }
      };
      if (scope.mode === 'only') add(scope.included, 'selected');
      add(scope.excluded, 'ignored');

      const hovered = hoverRef.current;
      if (picking && hovered && manager && hovered.isConnected) {
        const action = manager.getToggleAction(hovered);
        const box = toBox('hover', 'hover', `${HOVER_HINTS[action]} · ${hovered.tagName.toLowerCase()}`, hovered);
        if (box) next.push(box);
      }

      const signature = next
        .map((b) => `${b.key}|${b.label}|${Math.round(b.top)},${Math.round(b.left)},${Math.round(b.width)},${Math.round(b.height)}`)
        .join(';');
      if (signature !== lastSignature.current) {
        lastSignature.current = signature;
        setBoxes(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, picking, showMarks, focusSelector, scope, manager]);

  if (boxes.length === 0) return null;

  return (
    <div className="ft-overlay" aria-hidden="true">
      {boxes.map((box) => (
        <div
          key={box.key}
          className={`ft-mark ft-mark-${box.kind}`}
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        >
          <span className={`ft-mark-label ${box.top < 22 ? 'ft-mark-label-inside' : ''}`}>{box.label}</span>
        </div>
      ))}
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState, CSSProperties } from 'react';
import { generateFontExport } from '@font-tastic/core';
import { Check, Copy } from 'lucide-react';
import { BODY_FONTS, FontOption, HEADING_FONTS, MONO_FONT, fontStack } from './fonts';
import { INSTALL_CMD } from './links';

const STEPS = [
  { id: 'heading', tab: 'Headings', line: 'Pick a heading face. This page is the preview.' },
  { id: 'body', tab: 'Body', line: 'Now the body text. Everything below changes with it.' },
  { id: 'export', tab: 'Export', line: 'Copy the config. That is the whole workflow.' }
] as const;

const LAST = STEPS.length - 1;
const PIN_QUERY =
  '(min-width: 1200px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)';

const inertWhen = (on: boolean) => (on ? ({ inert: '' } as object) : {});
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Maps scroll progress 0..1 to a reel position 0..LAST with a hold on every step. */
function reelPosition(progress: number) {
  const scaled = progress * (LAST + 0.5 * (LAST + 1));
  // Each step: 0.5 hold, then 1.0 of travel to the next.
  let remaining = scaled;
  for (let step = 0; step < LAST; step++) {
    if (remaining <= 0.5) return step;
    remaining -= 0.5;
    if (remaining <= 1) return step + smooth(remaining);
    remaining -= 1;
  }
  return LAST;
}

/** Scroll progress at which a step sits in the middle of its hold. */
function progressForStep(step: number) {
  const total = LAST + 0.5 * (LAST + 1);
  return clamp((step * 1.5 + 0.25) / total, 0, 1);
}

interface HeroProps {
  heading: FontOption;
  body: FontOption;
  onHeading: (family: string) => void;
  onBody: (family: string) => void;
  onOpenDevtool: () => void;
}

export function Hero({ heading, body, onHeading, onBody, onOpenDevtool }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfARef = useRef<HTMLSpanElement>(null);
  const halfBRef = useRef<HTMLSpanElement>(null);

  const [pinned, setPinned] = useState(() => window.matchMedia(PIN_QUERY).matches);
  const [active, setActive] = useState(0);
  const [snippetTab, setSnippetTab] = useState<'css' | 'tailwind'>('css');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const onChange = () => {
      setPinned(mq.matches);
      setActive(0);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Pinned mode: the page's own scroll advances the reel.
  useEffect(() => {
    if (!pinned) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      const stage = stageRef.current;
      const track = trackRef.current;
      if (!section || !stage || !track) return;
      const rect = section.getBoundingClientRect();
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const travel = rect.height - stage.offsetHeight;
      const progress = travel > 0 ? clamp((stickyTop - rect.top) / travel, 0, 1) : 0;
      const pos = reelPosition(progress);
      track.style.setProperty('--reel-pos', pos.toFixed(4));
      setActive(Math.round(pos));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pinned]);

  const goToStep = useCallback(
    (step: number) => {
      if (!pinned) {
        setActive(step);
        return;
      }
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const travel = section.offsetHeight - stage.offsetHeight;
      window.scrollTo({
        top: sectionTop - stickyTop + travel * progressForStep(step),
        behavior: 'smooth'
      });
    },
    [pinned]
  );

  // Keep both halves of the headline on one line each, whatever face is picked.
  const fitHeadline = useCallback(() => {
    const stage = stageRef.current;
    const halves = [halfARef.current, halfBRef.current];
    if (!stage || halves.some((h) => !h)) return;
    stage.style.setProperty('--fit', '1');
    let fit = 1;
    for (const half of halves) {
      const inner = half!.firstElementChild as HTMLElement | null;
      if (!inner) continue;
      const available = half!.clientWidth;
      const needed = inner.offsetWidth;
      if (needed > available && needed > 0) fit = Math.min(fit, available / needed);
    }
    stage.style.setProperty('--fit', fit.toFixed(3));
  }, []);

  useLayoutEffect(() => {
    fitHeadline();
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && fitHeadline());
    document.fonts?.load(`500 40px "${heading.family}"`).then(() => !cancelled && fitHeadline());
    window.addEventListener('resize', fitHeadline);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', fitHeadline);
    };
  }, [heading.family, pinned, fitHeadline]);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
  };

  const exported = generateFontExport({
    headingFont: heading.family,
    bodyFont: body.family,
    monoFont: MONO_FONT
  });
  const snippet = snippetTab === 'css' ? exported.cssVariablesSnippet : exported.tailwindV4Snippet;
  // The frame shows the variables block; Copy takes the whole snippet.
  const snippetPreview = snippet.slice(0, snippet.indexOf('}') + 1);

  const trackStyle = (pinned ? {} : { '--reel-pos': active }) as CSSProperties;

  return (
    <section
      ref={sectionRef}
      className={`hero ${pinned ? 'hero--pinned' : 'hero--tabs'}`}
      aria-label="Font-Tastic live demo"
    >
      <div ref={stageRef} className="hero-stage">
        <h1 className="hero-title">
          <span ref={halfARef} className="hero-half hero-half--a">
            <span>Stop guessing.</span>
          </span>{' '}
          <span ref={halfBRef} className="hero-half hero-half--b">
            <span>Just look at it.</span>
          </span>
        </h1>

        <div className="hero-reel" data-first={active === 0 || undefined}>
          <div ref={trackRef} className="hero-track" style={trackStyle}>
            <FontFrame
              title="Headings"
              target="h1 to h6"
              dot="#3b82f6"
              name="hero-heading-font"
              options={HEADING_FONTS}
              value={heading.family}
              onPick={onHeading}
              current={active === 0}
              inert={!pinned && active !== 0}
            />
            <FontFrame
              title="Body & UI"
              target="p, button, input"
              dot="#a855f7"
              name="hero-body-font"
              options={BODY_FONTS}
              value={body.family}
              onPick={onBody}
              current={active === 1}
              inert={!pinned && active !== 1}
            />
            <div
              className="ui-frame"
              data-ui
              data-current={active === 2 || undefined}
              {...inertWhen(!pinned && active !== 2)}
            >
              <div className="ui-frame-head">
                <span className="ui-dot" style={{ background: '#10b981' }} />
                <span className="ui-frame-title">Export</span>
                <div className="ui-seg" role="group" aria-label="Export format">
                  <button
                    type="button"
                    aria-pressed={snippetTab === 'css'}
                    onClick={() => setSnippetTab('css')}
                  >
                    CSS variables
                  </button>
                  <button
                    type="button"
                    aria-pressed={snippetTab === 'tailwind'}
                    onClick={() => setSnippetTab('tailwind')}
                  >
                    Tailwind v4
                  </button>
                </div>
              </div>
              <pre className="ui-code" aria-label="Generated font config">
                <code>{snippetPreview}</code>
              </pre>
              <button type="button" className="ui-copy" onClick={() => copy('snippet', snippet)}>
                {copied === 'snippet' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied === 'snippet' ? 'Copied' : 'Copy config'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="hero-steps">
          <p className="hero-step-line" aria-live="polite">
            {STEPS[active].line}
          </p>
          <div className="hero-tabs" role="group" aria-label="Demo steps">
            {STEPS.map((step, i) => (
              <button
                key={step.id}
                type="button"
                aria-pressed={active === i}
                onClick={() => goToStep(i)}
              >
                {step.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="hero-support">
          <p>
            Font-Tastic is an open-source devtool that swaps the fonts on your real UI while you
            watch, then hands you the config.
          </p>
          <div className="hero-actions">
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
            <button type="button" className="btn btn--accent" onClick={onOpenDevtool}>
              Open the devtool
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FontFrameProps {
  title: string;
  target: string;
  dot: string;
  name: string;
  options: FontOption[];
  value: string;
  onPick: (family: string) => void;
  current: boolean;
  inert: boolean;
}

function FontFrame({ title, target, dot, name, options, value, onPick, current, inert }: FontFrameProps) {
  return (
    <div className="ui-frame" data-ui data-current={current || undefined} {...inertWhen(inert)}>
      <div className="ui-frame-head">
        <span className="ui-dot" style={{ background: dot }} />
        <span className="ui-frame-title">{title}</span>
        <span className="ui-frame-target">{target}</span>
      </div>
      <div className="ui-fonts" role="radiogroup" aria-label={`${title} font`}>
        {options.map((option) => (
          <label key={option.family} className="ui-font">
            <input
              type="radio"
              name={name}
              value={option.family}
              checked={value === option.family}
              onChange={() => onPick(option.family)}
            />
            <span
              className="specimen ui-font-name"
              style={{ '--specimen': fontStack(option) } as CSSProperties}
            >
              {option.family}
            </span>
            <span className="ui-font-note">{option.note}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useId, useLayoutEffect, useRef, useState, CSSProperties } from 'react';
import { FontOption } from './fonts';

const EXAMPLES = [
  'Ship it Friday',
  'Pricing that grows with you',
  'Welcome back, Ana',
  'Nothing here yet'
];

const WEIGHTS = [400, 500, 600, 700];

export function TypeLine({ heading }: { heading: FontOption }) {
  const inputId = useId();
  const [text, setText] = useState(EXAMPLES[0]);
  const [weight, setWeight] = useState(500);
  const [spacing, setSpacing] = useState(-0.05);
  const [scale, setScale] = useState(1);

  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Long text shrinks to stay on one line instead of running off the edge.
  const fit = useCallback(() => {
    const section = sectionRef.current;
    const field = fieldRef.current;
    const measure = measureRef.current;
    if (!section || !field || !measure) return;
    const available = field.clientWidth;
    const needed = measure.offsetWidth;
    const ratio = needed > available && needed > 0 ? Math.max(0.3, available / needed) : 1;
    section.style.setProperty('--line-fit', ratio.toFixed(3));
  }, []);

  useLayoutEffect(() => {
    fit();
    let cancelled = false;
    document.fonts?.ready.then(() => !cancelled && fit());
    document.fonts
      ?.load(`${weight} 40px "${heading.family}"`)
      .then(() => !cancelled && fit());
    window.addEventListener('resize', fit);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', fit);
    };
  }, [fit, text, weight, spacing, scale, heading.family]);

  const lineStyle = {
    '--line-weight': weight,
    '--line-spacing': `${spacing}em`,
    '--line-scale': scale
  } as CSSProperties;

  return (
    <section ref={sectionRef} className="typeline" style={lineStyle}>
      <span ref={measureRef} className="typeline-measure" aria-hidden="true">
        {text}
      </span>
      <h2 data-reveal>
        <label htmlFor={inputId}>Now try it on your own words.</label>
      </h2>

      <div ref={fieldRef} className="typeline-field" data-ui data-reveal>
        <input
          id={inputId}
          className="typeline-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          maxLength={60}
        />
      </div>

      <div className="typeline-answer ui-frame" data-ui data-reveal>
        <div className="ui-frame-head">
          <span className="ui-dot" style={{ background: '#3b82f6' }} />
          <span className="ui-frame-title">Headings</span>
          <span className="ui-frame-target">{heading.family}</span>
        </div>

        <div className="ui-row">
          <span className="ui-row-label" id={`${inputId}-weight`}>
            Weight
          </span>
          <div className="ui-seg" role="radiogroup" aria-labelledby={`${inputId}-weight`}>
            {WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={weight === w}
                onClick={() => setWeight(w)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <label className="ui-row">
          <span className="ui-row-label">Letter spacing</span>
          <input
            type="range"
            min={-0.1}
            max={0.1}
            step={0.005}
            value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
          />
          <output className="ui-row-value">{spacing.toFixed(3)}em</output>
        </label>

        <label className="ui-row">
          <span className="ui-row-label">Size scale</span>
          <input
            type="range"
            min={0.6}
            max={1.2}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
          <output className="ui-row-value">{scale.toFixed(2)}×</output>
        </label>
      </div>

      <ul className="typeline-examples" data-reveal aria-label="Example headlines">
        {EXAMPLES.map((example) => (
          <li key={example}>
            <button type="button" aria-pressed={text === example} onClick={() => setText(example)}>
              {example}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

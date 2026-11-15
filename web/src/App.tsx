import { useEffect, useState } from 'react';
import { FontTastic } from '@font-tastic/devtool';
import { Changelog } from './Changelog';
import { Docs } from './Docs';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { TypeLine } from './TypeLine';
import {
  BODY_FONTS,
  DEFAULT_BODY,
  DEFAULT_HEADING,
  HEADING_FONTS,
  applySiteFonts,
  findFont,
  loadSiteFont,
  preloadSiteFonts
} from './fonts';
import { GITHUB_URL, NPM_URL } from './links';

const triggerDevtool = () => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'F',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    })
  );
};

export function App() {
  const [headingFamily, setHeadingFamily] = useState(DEFAULT_HEADING);
  const [bodyFamily, setBodyFamily] = useState(DEFAULT_BODY);

  const heading = findFont(HEADING_FONTS, headingFamily);
  const body = findFont(BODY_FONTS, bodyFamily);

  // Load every face the hero offers so each row can show its own letters.
  useEffect(() => {
    preloadSiteFonts();
  }, []);

  // The picked faces re-set the whole page through the CSS variables the devtool detects.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSiteFont(heading.family), loadSiteFont(body.family)]).then(() => {
      if (!cancelled) applySiteFonts(heading, body);
    });
    return () => {
      cancelled = true;
    };
  }, [heading, body]);

  // Section entrances. Content is only hidden once this script is running.
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window) || items.length === 0) return;
    const counters = new Map<Element, number>();
    for (const item of items) {
      const group = item.closest('section, footer') ?? document.body;
      const index = counters.get(group) ?? 0;
      counters.set(group, index + 1);
      item.style.setProperty('--reveal-i', String(index % 6));
    }
    document.documentElement.classList.add('reveal-on');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((item) => observer.observe(item));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('reveal-on');
    };
  }, []);

  return (
    <div id="top" className="site">
      <header className="bar">
        <a href="#top" className="bar-mark">
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span>Font-Tastic</span>
        </a>
        <nav className="bar-links" aria-label="Main">
          <a href="#docs">Docs</a>
          <a href="#changelog">What's new</a>
          <a href={NPM_URL} target="_blank" rel="noopener noreferrer">
            npm
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="bar-keep">
            GitHub
          </a>
          <a href="#docs" className="btn btn--accent">
            Get started
          </a>
        </nav>
      </header>

      <main>
        <Hero
          heading={heading}
          body={body}
          onHeading={setHeadingFamily}
          onBody={setBodyFamily}
          onOpenDevtool={triggerDevtool}
        />
        <TypeLine heading={heading} />
        <Docs heading={heading} body={body} />
        <Changelog />
      </main>

      <Footer onOpenDevtool={triggerDevtool} />

      {/* The product itself, running on its own site. */}
      <FontTastic initialOpen={false} position="bottom-right" />
    </div>
  );
}

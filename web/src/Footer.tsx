import { RELEASES } from './changelog';
import { AUTHOR_URL, EMAIL, GITHUB_URL, NPM_URL } from './links';

export function Footer({ onOpenDevtool }: { onOpenDevtool: () => void }) {
  const latest = RELEASES[0];
  const released = new Date(`${latest.date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <footer className="foot">
      <div className="tile tile--say" data-reveal>
        <p>The in-app typography studio for modern web projects.</p>
        <small>
          MIT licensed. Made with love, order and progress by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noopener noreferrer">
            Antonio Madera
          </a>
          .
        </small>
      </div>

      <nav className="tile tile--nav" aria-label="Footer" data-reveal>
        <a href="#docs">Docs</a>
        <a href="#changelog">What's new</a>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        <a href={NPM_URL} target="_blank" rel="noopener noreferrer">
          npm
        </a>
      </nav>

      <div className="tile tile--version" data-reveal>
        <p>v{latest.version}</p>
        <small>
          Latest release
          <br />
          <time dateTime={latest.date}>{released}</time>
        </small>
      </div>

      <div className="tile tile--mail" data-reveal>
        <small>Questions and ideas</small>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>

      <a className="tile tile--mark" href="#top" aria-label="Font-Tastic, back to top" data-reveal>
        <span>Font-Tastic</span>
      </a>

      <button type="button" className="tile tile--go" onClick={onOpenDevtool} data-reveal>
        <span>Open the devtool</span>
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
          <path d="M8 40 40 8M14 8h26v26" stroke="currentColor" strokeWidth="4" />
        </svg>
      </button>
    </footer>
  );
}

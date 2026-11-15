import { useState } from 'react';
import { RELEASES, ChangeKind } from './changelog';
import { GITHUB_URL } from './links';

const KIND_LABEL: Record<ChangeKind, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
  docs: 'Release'
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

export function Changelog() {
  const [version, setVersion] = useState(RELEASES[0].version);
  const release = RELEASES.find((r) => r.version === version) ?? RELEASES[0];

  return (
    <section id="changelog" className="log">
      <div className="log-head" data-reveal>
        <h2>
          <span>What's new,</span>
          <br />
          release by release.
        </h2>
        <a className="btn btn--plain" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          View on GitHub
        </a>
      </div>

      <div className="log-body" data-reveal>
        <div className="log-tabs" role="tablist" aria-label="Releases" aria-orientation="vertical">
          {RELEASES.map((r) => (
            <button
              key={r.version}
              type="button"
              role="tab"
              id={`log-tab-${r.version}`}
              aria-selected={r.version === release.version}
              aria-controls="log-panel"
              onClick={() => setVersion(r.version)}
            >
              <span className="log-tab-version">v{r.version}</span>
              <time dateTime={r.date}>{formatDate(r.date)}</time>
            </button>
          ))}
        </div>

        <div
          className="log-panel"
          id="log-panel"
          role="tabpanel"
          aria-labelledby={`log-tab-${release.version}`}
          key={release.version}
        >
          <h3>{release.title}</h3>
          <p className="log-summary">{release.summary}</p>
          <ul className="log-bands">
            {release.changes.map((change) => (
              <li key={change.title}>
                <span className="log-kind">{KIND_LABEL[change.kind]}</span>
                <div>
                  <strong>{change.title}</strong>
                  <p>{change.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

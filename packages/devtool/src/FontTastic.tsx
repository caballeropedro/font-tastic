import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  detectProjectTypography,
  FontOverrideManager,
  GOOGLE_FONTS_CATALOG,
  CURATED_PAIRINGS,
  generateFontExport,
  ProjectTypographyState,
  FontCategory,
  ChannelState,
  loadGoogleFont
} from '@font-tastic/core';
import { DEVTOOL_CSS } from './styles';
import {
  Type,
  X,
  Search,
  Sparkles,
  RotateCcw,
  Sliders,
  Check,
  Copy,
  Terminal,
  Code,
  Layers,
  Info
} from 'lucide-react';

export interface FontTasticProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

function FontTasticLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect x="6" y="6" width="108" height="108" rx="22" fill="#0F172A" stroke="#334155" strokeWidth="4" />
      <path
        d="M28 24H60V27.5C53.5 27.5 50 30.5 50 37.5V82.5C50 89.5 53.5 92.5 60 92.5V96H28V92.5C34.5 92.5 38 89.5 38 82.5V37.5C38 30.5 34.5 27.5 28 27.5V24Z"
        fill="#F8FAFC"
      />
      <rect x="44" y="39" width="48" height="11" rx="5.5" fill="#0B1324" stroke="#38BDF8" strokeOpacity="0.7" strokeWidth="2" />
      <rect x="46.5" y="41.5" width="31" height="6" rx="3" fill="#3B82F6" />
      <circle cx="77" cy="44.5" r="7.5" fill="#F8FAFC" stroke="#3B82F6" strokeWidth="3.5" />
      <rect x="44" y="58.5" width="48" height="11" rx="5.5" fill="#0B1324" stroke="#22D3EE" strokeOpacity="0.7" strokeWidth="2" />
      <rect x="46.5" y="61" width="19" height="6" rx="3" fill="#22D3EE" />
      <circle cx="65.5" cy="64" r="7.5" fill="#F8FAFC" stroke="#22D3EE" strokeWidth="3.5" />
    </svg>
  );
}

export function FontTastic({ initialOpen = false, position = 'bottom-right' }: FontTasticProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<'browse' | 'pairings' | 'detected' | 'export'>('browse');
  const [activeChannelId, setActiveChannelId] = useState<string>('heading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FontCategory | 'all'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportFramework, setExportFramework] = useState<'tailwind-v3' | 'tailwind-v4' | 'css-vars' | 'fontsource' | 'nextjs'>('tailwind-v3');

  const [projectState, setProjectState] = useState<ProjectTypographyState | null>(null);
  const [channelStates, setChannelStates] = useState<Map<string, ChannelState>>(new Map());

  // Manager reference
  const managerRef = useRef<FontOverrideManager | null>(null);

  // Initialize styles, detector, and manager
  useEffect(() => {
    // 1. Inject widget CSS styles
    const styleId = 'font-tastic-devtool-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = DEVTOOL_CSS;
      document.head.appendChild(styleEl);
    }

    // 2. Detect project typography
    const detected = detectProjectTypography();
    setProjectState(detected);

    // 3. Initialize Override Manager
    const manager = new FontOverrideManager(detected.recommendedChannels);
    managerRef.current = manager;

    const unsubscribe = manager.subscribe((states) => {
      setChannelStates(new Map(states));
    });

    setChannelStates(manager.getAllStates());

    // 4. Keyboard shortcut: Ctrl+Shift+F or Cmd+Shift+F
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered fonts list
  const filteredFonts = useMemo(() => {
    return GOOGLE_FONTS_CATALOG.filter((f) => {
      const matchesSearch =
        f.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  // Active channel config & state
  const currentChannelConfig = useMemo(() => {
    return projectState?.recommendedChannels.find((c) => c.id === activeChannelId);
  }, [projectState, activeChannelId]);

  const currentChannelState = channelStates.get(activeChannelId);

  // Handle applying a font to active channel
  const handleSelectFont = async (fontFamily: string) => {
    if (!managerRef.current) return;
    await managerRef.current.applyFont(activeChannelId, fontFamily);
  };

  // Handle applying a pairing
  const handleApplyPairing = async (headingFont: string, bodyFont: string) => {
    if (!managerRef.current) return;
    await Promise.all([
      managerRef.current.applyFont('heading', headingFont),
      managerRef.current.applyFont('body', bodyFont)
    ]);
  };

  // Shuffle / Randomize pairing
  const handleShuffle = () => {
    const randomPair = CURATED_PAIRINGS[Math.floor(Math.random() * CURATED_PAIRINGS.length)];
    if (randomPair) {
      handleApplyPairing(randomPair.headingFont, randomPair.bodyFont);
    }
  };

  // Copy code helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export snippets calculation
  const exportData = useMemo(() => {
    const headingFont = channelStates.get('heading')?.selectedFont || projectState?.computedFonts.heading || 'Space Grotesk';
    const bodyFont = channelStates.get('body')?.selectedFont || projectState?.computedFonts.body || 'Inter';
    const monoFont = channelStates.get('mono')?.selectedFont || projectState?.computedFonts.mono || 'JetBrains Mono';

    return generateFontExport({
      headingFont,
      bodyFont,
      monoFont,
      headingVar: currentChannelConfig?.targetVar || '--font-heading',
      bodyVar: '--font-body',
      monoVar: '--font-mono'
    });
  }, [channelStates, projectState, currentChannelConfig]);

  // Count active overrides
  const activeOverrideCount = useMemo(() => {
    let count = 0;
    channelStates.forEach((st) => {
      if (st.selectedFont) count++;
    });
    return count;
  }, [channelStates]);

  const triggerPositionStyle = position === 'bottom-left' ? { left: '20px', right: 'auto' } : { right: '20px', left: 'auto' };

  return (
    <div className="ft-root">
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <button
          className="ft-trigger"
          style={triggerPositionStyle}
          onClick={() => setIsOpen(true)}
          title="Open Font-Tastic Typography Devtool (Ctrl+Shift+F)"
        >
          <FontTasticLogo size={20} />
          <span style={{ fontWeight: 600 }}>Font-Tastic</span>
          {activeOverrideCount > 0 ? (
            <span className="ft-trigger-badge">{activeOverrideCount} Active</span>
          ) : (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>Ctrl+Shift+F</span>
          )}
        </button>
      )}

      {/* Main Devtool Drawer */}
      {isOpen && (
        <div className="ft-drawer" style={triggerPositionStyle}>
          {/* Header */}
          <div className="ft-header">
            <div className="ft-header-title">
              <FontTasticLogo size={22} />
              <span>Font-Tastic</span>
              {projectState?.isTailwindDetected && (
                <span className="ft-tag">
                  Tailwind {projectState.tailwindVersion || 'CSS'}
                </span>
              )}
            </div>
            <div className="ft-header-actions">
              {activeOverrideCount > 0 && (
                <button
                  className="ft-icon-btn"
                  onClick={() => managerRef.current?.resetAll()}
                  title="Reset all font overrides to project default"
                >
                  <RotateCcw size={15} />
                </button>
              )}
              <button
                className="ft-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close Devtool"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="ft-tabs">
            <button
              className={`ft-tab ${activeTab === 'browse' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              <Type size={14} />
              <span>Channels</span>
            </button>
            <button
              className={`ft-tab ${activeTab === 'pairings' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('pairings')}
            >
              <Sparkles size={14} />
              <span>Pairings</span>
            </button>
            <button
              className={`ft-tab ${activeTab === 'detected' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('detected')}
            >
              <Layers size={14} />
              <span>Detected Setup</span>
            </button>
            <button
              className={`ft-tab ${activeTab === 'export' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <Code size={14} />
              <span>Export</span>
            </button>
          </div>

          {/* Tab 1: Channels & Browse */}
          {activeTab === 'browse' && (
            <div className="ft-body">
              {/* Channel Selector Pills */}
              <div className="ft-channel-pills">
                <button
                  className={`ft-channel-pill ${activeChannelId === 'heading' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('heading')}
                >
                  Headings (H1-H6)
                </button>
                <button
                  className={`ft-channel-pill ${activeChannelId === 'body' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('body')}
                >
                  Body & UI
                </button>
                <button
                  className={`ft-channel-pill ${activeChannelId === 'mono' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('mono')}
                >
                  Code / Mono
                </button>
              </div>

              {/* Active Channel Info & Quick Sliders */}
              <div className="ft-status-card">
                <div className="ft-status-card-header">
                  <div>
                    <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                      Current {currentChannelConfig?.label} Font:
                    </span>
                    <div className="ft-status-font-name">
                      {currentChannelState?.selectedFont || 'Project Default'}
                    </div>
                  </div>
                  {currentChannelState?.selectedFont && (
                    <button
                      className="ft-icon-btn"
                      onClick={() => managerRef.current?.resetChannel(activeChannelId)}
                      title="Reset this channel"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>

                {/* Typography Sliders */}
                <div className="ft-controls-grid">
                  <div className="ft-control-item">
                    <span className="ft-control-label">
                      Letter Spacing ({currentChannelState?.letterSpacing || 'normal'})
                    </span>
                    <input
                      type="range"
                      min="-2"
                      max="6"
                      step="0.5"
                      defaultValue="0"
                      className="ft-slider"
                      onChange={(e) => {
                        const val = `${e.target.value}px`;
                        managerRef.current?.updateTypographyParams(activeChannelId, {
                          letterSpacing: val
                        });
                      }}
                    />
                  </div>
                  <div className="ft-control-item">
                    <span className="ft-control-label">
                      Scale (x{currentChannelState?.fontSizeScale || '1.0'})
                    </span>
                    <input
                      type="range"
                      min="0.8"
                      max="1.4"
                      step="0.05"
                      defaultValue="1.0"
                      className="ft-slider"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        managerRef.current?.updateTypographyParams(activeChannelId, {
                          fontSizeScale: val
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="ft-search-box">
                <Search size={14} className="ft-search-icon" />
                <input
                  type="text"
                  placeholder="Search Google fonts (e.g. Inter, Space, Tech, Luxury)..."
                  className="ft-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter Chips */}
              <div className="ft-category-chips">
                {(['all', 'sans-serif', 'serif', 'display', 'monospace', 'handwriting'] as const).map((cat) => (
                  <button
                    key={cat}
                    className={`ft-chip ${selectedCategory === cat ? 'ft-chip-active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat === 'all' ? 'All Types' : cat}
                  </button>
                ))}
              </div>

              {/* Font Cards Grid */}
              <div className="ft-font-grid">
                {filteredFonts.map((font) => {
                  const isSelected = currentChannelState?.selectedFont === font.family;

                  // Preload specimen font when rendering card
                  loadGoogleFont(font.family);

                  return (
                    <div
                      key={font.family}
                      className={`ft-font-card ${isSelected ? 'ft-font-card-selected' : ''}`}
                      onClick={() => handleSelectFont(font.family)}
                    >
                      <div className="ft-font-card-top">
                        <span className="ft-font-title">{font.family}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                            {font.category}
                          </span>
                          {isSelected && <Check size={14} color="#3b82f6" />}
                        </div>
                      </div>

                      <div
                        className="ft-font-preview"
                        style={{ fontFamily: `"${font.family}", sans-serif` }}
                      >
                        Sphinx of black quartz, judge my vow.
                      </div>

                      <div className="ft-font-tags">
                        {font.tags?.map((t) => (
                          <span key={t} className="ft-mini-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Pairings */}
          {activeTab === 'pairings' && (
            <div className="ft-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Curated Headings + Body Combinations
                </span>
                <button
                  className="ft-copy-btn"
                  style={{ position: 'static' }}
                  onClick={handleShuffle}
                >
                  <Sparkles size={12} />
                  <span>Randomize</span>
                </button>
              </div>

              <div className="ft-font-grid">
                {CURATED_PAIRINGS.map((pairing) => {
                  loadGoogleFont(pairing.headingFont);
                  loadGoogleFont(pairing.bodyFont);

                  const isHeadingActive = channelStates.get('heading')?.selectedFont === pairing.headingFont;
                  const isBodyActive = channelStates.get('body')?.selectedFont === pairing.bodyFont;
                  const isActive = isHeadingActive && isBodyActive;

                  return (
                    <div
                      key={pairing.id}
                      className={`ft-pairing-card ${isActive ? 'ft-font-card-selected' : ''}`}
                      onClick={() => handleApplyPairing(pairing.headingFont, pairing.bodyFont)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>
                          {pairing.name}
                        </span>
                        {isActive && <Check size={14} color="#3b82f6" />}
                      </div>

                      <div
                        className="ft-pairing-preview-h"
                        style={{ fontFamily: `"${pairing.headingFont}", sans-serif` }}
                      >
                        {pairing.headingFont}
                      </div>

                      <div
                        className="ft-pairing-preview-b"
                        style={{ fontFamily: `"${pairing.bodyFont}", sans-serif` }}
                      >
                        Body in {pairing.bodyFont}: {pairing.description}
                      </div>

                      <div className="ft-font-tags">
                        {pairing.tags.map((t) => (
                          <span key={t} className="ft-mini-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Detected Project Setup */}
          {activeTab === 'detected' && (
            <div className="ft-body">
              <div className="ft-status-card">
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} color="#3b82f6" />
                  <span>Auto-Detected Project Typography</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Font-Tastic inspected your DOM, computed styles, and stylesheet variables.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="ft-control-label">Computed Element Fonts</span>
                <div className="ft-code-block" style={{ padding: 10 }}>
                  <div><strong>H1 Heading:</strong> {projectState?.computedFonts.heading || 'None'}</div>
                  <div style={{ marginTop: 4 }}><strong>Body Copy:</strong> {projectState?.computedFonts.body || 'None'}</div>
                  <div style={{ marginTop: 4 }}><strong>Code / Mono:</strong> {projectState?.computedFonts.mono || 'None'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span className="ft-control-label">Discovered CSS Variables</span>
                {projectState?.cssVariables && projectState.cssVariables.length > 0 ? (
                  <div className="ft-code-block" style={{ padding: 10 }}>
                    {projectState.cssVariables.map((v) => (
                      <div key={v.name} style={{ marginBottom: 4 }}>
                        <span style={{ color: '#60a5fa' }}>{v.name}</span>: {v.value};
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                    No root CSS font variables detected. Font-Tastic is applying rules directly via scoped element overrides!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Export Code */}
          {activeTab === 'export' && (
            <div className="ft-body">
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Make your chosen typography permanent in your codebase:
              </span>

              {/* Export Selector Chips */}
              <div className="ft-category-chips">
                <button
                  className={`ft-chip ${exportFramework === 'tailwind-v3' ? 'ft-chip-active' : ''}`}
                  onClick={() => setExportFramework('tailwind-v3')}
                >
                  Tailwind v3
                </button>
                <button
                  className={`ft-chip ${exportFramework === 'tailwind-v4' ? 'ft-chip-active' : ''}`}
                  onClick={() => setExportFramework('tailwind-v4')}
                >
                  Tailwind v4 (@theme)
                </button>
                <button
                  className={`ft-chip ${exportFramework === 'css-vars' ? 'ft-chip-active' : ''}`}
                  onClick={() => setExportFramework('css-vars')}
                >
                  CSS Variables
                </button>
                <button
                  className={`ft-chip ${exportFramework === 'fontsource' ? 'ft-chip-active' : ''}`}
                  onClick={() => setExportFramework('fontsource')}
                >
                  @fontsource (pnpm)
                </button>
                <button
                  className={`ft-chip ${exportFramework === 'nextjs' ? 'ft-chip-active' : ''}`}
                  onClick={() => setExportFramework('nextjs')}
                >
                  Next.js (next/font)
                </button>
              </div>

              {/* Snippet Output */}
              {exportFramework === 'tailwind-v3' && (
                <div className="ft-code-block">
                  <button
                    className="ft-copy-btn"
                    onClick={() => handleCopy('tw3', exportData.tailwindV3Snippet)}
                  >
                    {copiedKey === 'tw3' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedKey === 'tw3' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre>{exportData.tailwindV3Snippet}</pre>
                </div>
              )}

              {exportFramework === 'tailwind-v4' && (
                <div className="ft-code-block">
                  <button
                    className="ft-copy-btn"
                    onClick={() => handleCopy('tw4', exportData.tailwindV4Snippet)}
                  >
                    {copiedKey === 'tw4' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedKey === 'tw4' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre>{exportData.tailwindV4Snippet}</pre>
                </div>
              )}

              {exportFramework === 'css-vars' && (
                <>
                  <div className="ft-code-block">
                    <button
                      className="ft-copy-btn"
                      onClick={() => handleCopy('html', exportData.htmlHeadSnippet)}
                    >
                      {copiedKey === 'html' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedKey === 'html' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <pre>{exportData.htmlHeadSnippet}</pre>
                  </div>
                  <div className="ft-code-block" style={{ marginTop: 8 }}>
                    <button
                      className="ft-copy-btn"
                      onClick={() => handleCopy('css', exportData.cssVariablesSnippet)}
                    >
                      {copiedKey === 'css' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedKey === 'css' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <pre>{exportData.cssVariablesSnippet}</pre>
                  </div>
                </>
              )}

              {exportFramework === 'fontsource' && (
                <>
                  <div className="ft-code-block">
                    <button
                      className="ft-copy-btn"
                      onClick={() => handleCopy('fs-cmd', exportData.fontsourceInstallCmd)}
                    >
                      {copiedKey === 'fs-cmd' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedKey === 'fs-cmd' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <pre>{exportData.fontsourceInstallCmd}</pre>
                  </div>
                  <div className="ft-code-block" style={{ marginTop: 8 }}>
                    <button
                      className="ft-copy-btn"
                      onClick={() => handleCopy('fs-imp', exportData.fontsourceImports)}
                    >
                      {copiedKey === 'fs-imp' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copiedKey === 'fs-imp' ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <pre>{exportData.fontsourceImports}</pre>
                  </div>
                </>
              )}

              {exportFramework === 'nextjs' && (
                <div className="ft-code-block">
                  <button
                    className="ft-copy-btn"
                    onClick={() => handleCopy('next', exportData.nextConfigSnippet)}
                  >
                    {copiedKey === 'next' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedKey === 'next' ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <pre>{exportData.nextConfigSnippet}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

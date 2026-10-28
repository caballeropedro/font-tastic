import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  detectProjectTypography,
  FontOverrideManager,
  GOOGLE_FONTS_CATALOG,
  CURATED_PAIRINGS,
  generateFontExport,
  ProjectTypographyState,
  FontCategory,
  FontItem,
  CustomFontItem,
  ChannelState,
  TypographyHistoryEntry,
  loadGoogleFont,
  getCustomFonts,
  subscribeCustomFonts,
  importFontFromFile,
  importFontFromUrl,
  removeCustomFont,
  inferFontFamilyFromFilename,
  inferFontInfoFromUrl
} from '@font-tastic/core';
import { DEVTOOL_CSS } from './styles';
import {
  Type,
  X,
  Search,
  Sparkles,
  RotateCcw,
  Check,
  Copy,
  Code,
  Layers,
  Info,
  Eye,
  EyeOff,
  BoxSelect,
  History,
  Trash2,
  Upload,
  Link,
  Plus
} from 'lucide-react';

export interface FontTasticProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

const GROUP_COLORS: Record<string, string> = {
  heading: '#3b82f6',
  body: '#a855f7',
  mono: '#10b981'
};

function LetterSpacingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="2.5" x2="2" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="14" y1="2.5" x2="14" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M5.5 11.5L8 4.5L10.5 11.5M6.3 9.5H9.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FontSizeScaleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 12L5 5.5L7.5 12M3.2 10.2H6.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12L11.5 3.5L14.5 12M9.4 9.6H13.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const [activeTab, setActiveTab] = useState<'browse' | 'pairings' | 'history' | 'detected' | 'export'>('browse');
  const [activeChannelId, setActiveChannelId] = useState<string>('heading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FontCategory | 'all' | 'custom'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportFramework, setExportFramework] = useState<'tailwind-v3' | 'tailwind-v4' | 'css-vars' | 'fontsource' | 'nextjs'>('tailwind-v3');

  // Custom Font Import state
  const [customFonts, setCustomFonts] = useState<CustomFontItem[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importFamilyName, setImportFamilyName] = useState('');
  const [importFamilyTouched, setImportFamilyTouched] = useState(false);
  const [importCategory, setImportCategory] = useState<FontCategory>('sans-serif');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [projectState, setProjectState] = useState<ProjectTypographyState | null>(null);
  const [channelStates, setChannelStates] = useState<Map<string, ChannelState>>(new Map());
  const [appliedStates, setAppliedStates] = useState<Map<string, ChannelState>>(new Map());
  const [hasPending, setHasPending] = useState(false);
  const [overridesEnabled, setOverridesEnabled] = useState(true);
  const [highlightGroups, setHighlightGroups] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<TypographyHistoryEntry[]>([]);
  const [justAppliedToast, setJustAppliedToast] = useState(false);

  // Manager reference
  const managerRef = useRef<FontOverrideManager | null>(null);

  const syncFromManager = (manager: FontOverrideManager) => {
    setChannelStates(manager.getAllStates());
    setAppliedStates(manager.getAppliedStates());
    setHasPending(manager.hasPendingChanges());
    setOverridesEnabled(manager.isOverridesEnabled());
    setHighlightGroups(manager.isHighlightGroupsEnabled());
    setHistoryEntries(manager.getHistory());
  };

  // Initialize styles, detector, and manager
  useEffect(() => {
    // 1. Inject widget CSS styles
    const styleId = 'font-tastic-devtool-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = DEVTOOL_CSS;

    // 1b. Hydrate and subscribe to custom fonts
    const initialCustom = getCustomFonts();
    setCustomFonts(initialCustom);
    initialCustom.forEach((cf) => loadGoogleFont(cf.family));
    const unsubscribeCustom = subscribeCustomFonts((updated) => {
      setCustomFonts(updated);
    });

    // 2. Detect project typography
    const detected = detectProjectTypography();
    setProjectState(detected);

    // 3. Initialize Override Manager
    const manager = new FontOverrideManager(detected.recommendedChannels);
    managerRef.current = manager;

    const unsubscribe = manager.subscribe(() => {
      syncFromManager(manager);
    });

    syncFromManager(manager);

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
      unsubscribeCustom();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Combined & filtered fonts list (Custom fonts first, then Google Fonts catalog)
  const filteredFonts = useMemo(() => {
    const customNames = new Set(customFonts.map((cf) => cf.family.toLowerCase()));
    const combined: FontItem[] = [
      ...customFonts,
      ...GOOGLE_FONTS_CATALOG.filter((f) => !customNames.has(f.family.toLowerCase()))
    ];

    return combined.filter((f) => {
      const matchesSearch =
        f.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (selectedCategory === 'custom') {
        return matchesSearch && Boolean(f.isCustom);
      }
      const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [customFonts, searchQuery, selectedCategory]);

  // Handle file selection for custom font import
  const handleFileChosen = (file: File | null) => {
    setImportError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
      setImportError('Please select a valid font file (.woff2, .woff, .ttf, or .otf).');
      return;
    }
    setSelectedFile(file);
    const inferred = inferFontFamilyFromFilename(file.name);
    setImportFamilyName(inferred);
    setImportFamilyTouched(false);
  };

  // Handle URL input change for custom font import
  const handleUrlInputChange = (val: string) => {
    setImportUrl(val);
    setImportError(null);
    if (!importFamilyTouched || !importFamilyName.trim()) {
      const info = inferFontInfoFromUrl(val);
      if (info.inferredFamily) {
        setImportFamilyName(info.inferredFamily);
      }
    }
  };

  // Submit custom font import (file or URL)
  const handleImportSubmit = async () => {
    setImportError(null);
    setIsImporting(true);
    try {
      let imported: CustomFontItem;
      if (importMode === 'file') {
        if (!selectedFile) {
          setImportError('Please choose a font file (.woff2, .woff, .ttf, .otf) first.');
          setIsImporting(false);
          return;
        }
        imported = await importFontFromFile(selectedFile, {
          family: importFamilyName.trim() || undefined,
          category: importCategory
        });
      } else {
        if (!importUrl.trim()) {
          setImportError('Please enter a font stylesheet URL or direct font file URL.');
          setIsImporting(false);
          return;
        }
        imported = await importFontFromUrl(importUrl, {
          family: importFamilyName.trim() || undefined,
          category: importCategory
        });
      }

      // Immediately apply to active channel for live preview
      await handleSelectFont(imported.family);

      // Reset form and close import panel
      setSelectedFile(null);
      setImportUrl('');
      setImportFamilyName('');
      setImportFamilyTouched(false);
      setIsImportOpen(false);
      if (selectedCategory !== 'all' && selectedCategory !== 'custom' && selectedCategory !== imported.category) {
        setSelectedCategory('all');
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import font.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleRemoveCustomFont = (family: string) => {
    removeCustomFont(family);
    if (currentChannelState?.selectedFont?.toLowerCase() === family.toLowerCase()) {
      managerRef.current?.resetChannel(activeChannelId);
    }
  };

  // Active channel config & state
  const currentChannelConfig = useMemo(() => {
    return projectState?.recommendedChannels.find((c) => c.id === activeChannelId);
  }, [projectState, activeChannelId]);

  const currentChannelState = channelStates.get(activeChannelId);
  const currentAppliedState = appliedStates.get(activeChannelId);

  // Handle selecting a font for live preview
  const handleSelectFont = async (fontFamily: string) => {
    if (!managerRef.current) return;
    setJustAppliedToast(false);
    await managerRef.current.applyFont(activeChannelId, fontFamily);
  };

  // Handle applying a pairing for live preview
  const handleApplyPairing = async (headingFont: string, bodyFont: string) => {
    if (!managerRef.current) return;
    setJustAppliedToast(false);
    await Promise.all([
      managerRef.current.applyFont('heading', headingFont),
      managerRef.current.applyFont('body', bodyFont)
    ]);
  };

  // Commit / Apply the selected options
  const handleConfirmApply = () => {
    if (!managerRef.current) return;
    managerRef.current.applySelectedOptions();
    setJustAppliedToast(true);
    setTimeout(() => setJustAppliedToast(false), 2200);
  };

  // Discard / Cancel unapplied preview changes
  const handleCancelPreview = () => {
    if (!managerRef.current) return;
    managerRef.current.cancelPendingChanges();
    setJustAppliedToast(false);
  };

  // Toggle Master ON/OFF
  const handleToggleMaster = () => {
    if (!managerRef.current) return;
    managerRef.current.setOverridesEnabled(!overridesEnabled);
  };

  // Toggle Group Colored Boxes
  const handleToggleHighlightGroups = () => {
    if (!managerRef.current) return;
    managerRef.current.setHighlightGroups(!highlightGroups);
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
      if (
        st.selectedFont ||
        (st.letterSpacing && st.letterSpacing !== '0px' && st.letterSpacing !== 'normal') ||
        (st.fontSizeScale && st.fontSizeScale !== 1)
      ) {
        count++;
      }
    });
    return count;
  }, [channelStates]);

  const numericLetterSpacing = useMemo(() => {
    const raw = currentChannelState?.letterSpacing;
    if (!raw || raw === 'normal') return 0;
    const parsed = parseFloat(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [currentChannelState]);

  const numericScale = useMemo(() => {
    return currentChannelState?.fontSizeScale ?? 1.0;
  }, [currentChannelState]);

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
          {hasPending ? (
            <span className="ft-trigger-badge ft-trigger-badge-pending">Preview</span>
          ) : activeOverrideCount > 0 ? (
            <span className="ft-trigger-badge">
              {overridesEnabled ? `${activeOverrideCount} Applied` : 'Paused'}
            </span>
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
                  TW {projectState.tailwindVersion || 'CSS'}
                </span>
              )}
            </div>
            <div className="ft-header-actions">
              {/* Toggle Group Colored Boxes */}
              <button
                className={`ft-toggle-pill ${highlightGroups ? 'ft-toggle-pill-boxes-active' : ''}`}
                onClick={handleToggleHighlightGroups}
                title="Show/hide color-coded boxes around Headings, Body, and Code text groups"
              >
                <BoxSelect size={13} />
                <span>Group Boxes</span>
              </button>

              {/* Master ON/OFF Toggle */}
              <button
                className={`ft-toggle-pill ${overridesEnabled ? 'ft-toggle-pill-active' : ''}`}
                onClick={handleToggleMaster}
                title={
                  overridesEnabled
                    ? 'Live typography overrides are ON (click to compare with original)'
                    : 'Live typography overrides are OFF (click to enable)'
                }
              >
                {overridesEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{overridesEnabled ? 'ON' : 'OFF'}</span>
              </button>

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

          {/* Group Color Legend Banner when Group Boxes is ON */}
          {highlightGroups && (
            <div className="ft-group-legend">
              <span>Text Group Outlines:</span>
              <div className="ft-group-legend-items">
                <span className="ft-group-legend-item">
                  <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.heading }} />
                  Headings
                </span>
                <span className="ft-group-legend-item">
                  <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.body }} />
                  Body & UI
                </span>
                <span className="ft-group-legend-item">
                  <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.mono }} />
                  Code / Mono
                </span>
              </div>
            </div>
          )}

          {/* Pending Apply / Cancel Action Bar */}
          {(hasPending || justAppliedToast) && (
            <div className={`ft-apply-bar ${justAppliedToast && !hasPending ? 'ft-apply-bar-saved' : ''}`}>
              {hasPending ? (
                <>
                  <div className="ft-apply-status">
                    <span className="ft-apply-pulse" />
                    <span>Live previewing unapplied options</span>
                  </div>
                  <div className="ft-apply-actions">
                    <button
                      className="ft-btn-cancel"
                      onClick={handleCancelPreview}
                      title="Discard preview and revert to last applied options"
                    >
                      <X size={12} />
                      <span>Don't Apply</span>
                    </button>
                    <button
                      className="ft-btn-apply"
                      onClick={handleConfirmApply}
                      title="Apply and save selected options to localStorage & History"
                    >
                      <Check size={12} />
                      <span>Apply Options</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="ft-apply-status" style={{ color: '#34d399' }}>
                  <Check size={14} color="#10b981" />
                  <span>Options applied & saved to browser storage!</span>
                </div>
              )}
            </div>
          )}

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
              className={`ft-tab ${activeTab === 'history' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} />
              <span>Saved ({historyEntries.length})</span>
            </button>
            <button
              className={`ft-tab ${activeTab === 'detected' ? 'ft-tab-active' : ''}`}
              onClick={() => setActiveTab('detected')}
            >
              <Layers size={14} />
              <span>Detected</span>
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
              {/* Channel Selector Pills with Group Color Dots */}
              <div className="ft-channel-pills">
                <button
                  className={`ft-channel-pill ${activeChannelId === 'heading' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('heading')}
                >
                  <span
                    className="ft-color-dot"
                    style={{
                      backgroundColor: GROUP_COLORS.heading,
                      boxShadow: activeChannelId === 'heading' ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none'
                    }}
                  />
                  <span>Headings (H1-H6)</span>
                </button>
                <button
                  className={`ft-channel-pill ${activeChannelId === 'body' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('body')}
                >
                  <span
                    className="ft-color-dot"
                    style={{
                      backgroundColor: GROUP_COLORS.body,
                      boxShadow: activeChannelId === 'body' ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none'
                    }}
                  />
                  <span>Body & UI</span>
                </button>
                <button
                  className={`ft-channel-pill ${activeChannelId === 'mono' ? 'ft-channel-pill-active' : ''}`}
                  onClick={() => setActiveChannelId('mono')}
                >
                  <span
                    className="ft-color-dot"
                    style={{
                      backgroundColor: GROUP_COLORS.mono,
                      boxShadow: activeChannelId === 'mono' ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none'
                    }}
                  />
                  <span>Code / Mono</span>
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
                      <span>{currentChannelState?.selectedFont || 'Project Default'}</span>
                      {currentChannelState?.selectedFont && (
                        currentChannelState?.selectedFont === currentAppliedState?.selectedFont && !hasPending ? (
                          <span className="ft-badge-applied">Applied</span>
                        ) : (
                          <span className="ft-badge-preview">Preview</span>
                        )
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(currentChannelState?.selectedFont ||
                      numericLetterSpacing !== 0 ||
                      numericScale !== 1) && (
                      <button
                        className="ft-icon-btn"
                        onClick={() => managerRef.current?.resetChannel(activeChannelId)}
                        title="Reset this channel to default"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Typography Rectangular Inputs (Figma-style) */}
                <div className="ft-controls-grid">
                  <div className="ft-control-item">
                    <span className="ft-control-label">Letter spacing</span>
                    <div className="ft-rect-input-box">
                      <span
                        className="ft-rect-input-icon"
                        title="Drag horizontally to adjust letter spacing"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startVal = numericLetterSpacing;
                          const onMove = (moveEvent: MouseEvent) => {
                            const delta = Math.round((moveEvent.clientX - startX) / 6) * 0.5;
                            const next = Math.max(-4, Math.min(12, Number((startVal + delta).toFixed(1))));
                            managerRef.current?.updateTypographyParams(activeChannelId, {
                              letterSpacing: `${next}px`
                            });
                          };
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      >
                        <LetterSpacingIcon />
                      </span>
                      <input
                        type="number"
                        step="0.5"
                        min="-4"
                        max="12"
                        value={numericLetterSpacing}
                        className="ft-rect-input-field"
                        onChange={(e) => {
                          const raw = e.target.value;
                          const parsed = parseFloat(raw);
                          const val = Number.isNaN(parsed) ? '0px' : `${parsed}px`;
                          managerRef.current?.updateTypographyParams(activeChannelId, {
                            letterSpacing: val
                          });
                        }}
                      />
                      <span className="ft-rect-input-unit">px</span>
                    </div>
                  </div>

                  <div className="ft-control-item">
                    <span className="ft-control-label">Font size scale</span>
                    <div className="ft-rect-input-box">
                      <span
                        className="ft-rect-input-icon"
                        title="Drag horizontally to adjust font size scale"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startPercent = Math.round(numericScale * 100);
                          const onMove = (moveEvent: MouseEvent) => {
                            const delta = Math.round((moveEvent.clientX - startX) / 3);
                            const nextPercent = Math.max(60, Math.min(200, startPercent + delta));
                            managerRef.current?.updateTypographyParams(activeChannelId, {
                              fontSizeScale: Number((nextPercent / 100).toFixed(2))
                            });
                          };
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      >
                        <FontSizeScaleIcon />
                      </span>
                      <input
                        type="number"
                        step="5"
                        min="60"
                        max="200"
                        value={Math.round(numericScale * 100)}
                        className="ft-rect-input-field"
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          if (!Number.isNaN(parsed) && parsed > 0) {
                            managerRef.current?.updateTypographyParams(activeChannelId, {
                              fontSizeScale: Number((parsed / 100).toFixed(2))
                            });
                          }
                        }}
                      />
                      <span className="ft-rect-input-unit">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar + Import Custom Font Button */}
              <div className="ft-search-row">
                <div className="ft-search-box" style={{ flex: 1 }}>
                  <Search size={14} className="ft-search-icon" />
                  <input
                    type="text"
                    placeholder="Search fonts (e.g. Inter, Space, Custom)..."
                    className="ft-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className={`ft-import-trigger-btn ${isImportOpen ? 'ft-import-trigger-btn-active' : ''}`}
                  onClick={() => {
                    setIsImportOpen((prev) => !prev);
                    setImportError(null);
                  }}
                  title="Import custom font from local file (.woff2, .woff, .ttf, .otf) or URL"
                >
                  <Plus size={13} />
                  <span>Import Font</span>
                </button>
              </div>

              {/* Expandable Custom Font Import Panel (File or URL) */}
              {isImportOpen && (
                <div className="ft-import-panel">
                  <div className="ft-import-header">
                    <div className="ft-import-modes">
                      <button
                        type="button"
                        className={`ft-import-mode-btn ${importMode === 'file' ? 'ft-import-mode-btn-active' : ''}`}
                        onClick={() => {
                          setImportMode('file');
                          setImportError(null);
                        }}
                      >
                        <Upload size={12} />
                        <span>From File</span>
                      </button>
                      <button
                        type="button"
                        className={`ft-import-mode-btn ${importMode === 'url' ? 'ft-import-mode-btn-active' : ''}`}
                        onClick={() => {
                          setImportMode('url');
                          setImportError(null);
                        }}
                      >
                        <Link size={12} />
                        <span>From URL</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      className="ft-icon-btn"
                      onClick={() => setIsImportOpen(false)}
                      title="Close import panel"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {importMode === 'file' ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".woff2,.woff,.ttf,.otf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleFileChosen(file);
                          e.target.value = '';
                        }}
                      />
                      <div
                        className={`ft-dropzone ${isDraggingFile ? 'ft-dropzone-active' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          const file = e.dataTransfer.files?.[0] || null;
                          handleFileChosen(file);
                        }}
                      >
                        <Upload size={16} color={selectedFile ? '#3b82f6' : '#64748b'} />
                        {selectedFile ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 12 }}>
                              {selectedFile.name}
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>
                              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 11 }}>
                              Click to browse or drag & drop font file
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>
                              Supports .woff2, .woff, .ttf, .otf
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="ft-control-item">
                      <span className="ft-control-label">
                        Font URL (CSS Stylesheet, &lt;link&gt;, or .woff2/.ttf/.otf URL)
                      </span>
                      <input
                        type="text"
                        className="ft-input-field"
                        placeholder="https://api.fontshare.com/v2/css?f[]=satoshi@400,700 or https://.../font.woff2"
                        value={importUrl}
                        onChange={(e) => handleUrlInputChange(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="ft-import-fields-row">
                    <div className="ft-control-item">
                      <span className="ft-control-label">Font family name</span>
                      <input
                        type="text"
                        className="ft-input-field"
                        placeholder="e.g. Satoshi, Clash Display"
                        value={importFamilyName}
                        onChange={(e) => {
                          setImportFamilyName(e.target.value);
                          setImportFamilyTouched(true);
                        }}
                      />
                    </div>
                    <div className="ft-control-item">
                      <span className="ft-control-label">Category</span>
                      <select
                        className="ft-select-field"
                        value={importCategory}
                        onChange={(e) => setImportCategory(e.target.value as FontCategory)}
                      >
                        <option value="sans-serif">Sans-Serif</option>
                        <option value="serif">Serif</option>
                        <option value="display">Display</option>
                        <option value="monospace">Monospace</option>
                        <option value="handwriting">Handwriting</option>
                      </select>
                    </div>
                  </div>

                  {importError && <div className="ft-import-error">{importError}</div>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button
                      type="button"
                      className="ft-btn-cancel"
                      onClick={() => setIsImportOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="ft-btn-apply"
                      disabled={isImporting}
                      onClick={handleImportSubmit}
                    >
                      <Check size={12} />
                      <span>{isImporting ? 'Importing...' : `Import & Preview on ${currentChannelConfig?.label || 'Channel'}`}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Category Filter Chips */}
              <div className="ft-category-chips">
                {(['all', 'custom', 'sans-serif', 'serif', 'display', 'monospace', 'handwriting'] as const).map((cat) => {
                  if (cat === 'custom' && customFonts.length === 0) return null;
                  return (
                    <button
                      key={cat}
                      className={`ft-chip ${selectedCategory === cat ? 'ft-chip-active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'all'
                        ? 'All Types'
                        : cat === 'custom'
                        ? `Imported (${customFonts.length})`
                        : cat}
                    </button>
                  );
                })}
              </div>

              {/* Font Cards Grid */}
              <div className="ft-font-grid">
                {filteredFonts.map((font) => {
                  const isSelected = currentChannelState?.selectedFont === font.family;
                  const isApplied = currentAppliedState?.selectedFont === font.family;

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
                          {font.isCustom && <span className="ft-badge-custom">Custom</span>}
                          {isApplied && <span className="ft-badge-applied">Applied</span>}
                          {isSelected && !isApplied && <span className="ft-badge-preview">Preview</span>}
                          <span style={{ fontSize: 10, color: '#64748b', textTransform: 'capitalize' }}>
                            {font.category}
                          </span>
                          {font.isCustom && (
                            <button
                              type="button"
                              className="ft-icon-btn"
                              style={{ padding: 2 }}
                              title={`Remove custom font "${font.family}"`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCustomFont(font.family);
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                          {isSelected && <Check size={14} color="#3b82f6" />}
                        </div>
                      </div>

                      <div
                        className="ft-font-preview"
                        style={{ fontFamily: `"${font.family}", sans-serif` }}
                      >
                        Sphinx of black quartz, judge my vow.
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="ft-font-tags">
                          {font.tags?.map((t) => (
                            <span key={t} className="ft-mini-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                        {isSelected && hasPending && (
                          <button
                            className="ft-btn-apply"
                            style={{ padding: '3px 8px', fontSize: 10 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmApply();
                            }}
                          >
                            <Check size={11} />
                            <span>Apply</span>
                          </button>
                        )}
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

                  const isHeadingApplied = appliedStates.get('heading')?.selectedFont === pairing.headingFont;
                  const isBodyApplied = appliedStates.get('body')?.selectedFont === pairing.bodyFont;
                  const isPairingApplied = isHeadingApplied && isBodyApplied;

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isPairingApplied && <span className="ft-badge-applied">Applied</span>}
                          {isActive && !isPairingApplied && <span className="ft-badge-preview">Preview</span>}
                          {isActive && <Check size={14} color="#3b82f6" />}
                        </div>
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="ft-font-tags">
                          {pairing.tags.map((t) => (
                            <span key={t} className="ft-mini-tag">
                              {t}
                            </span>
                          ))}
                        </div>
                        {isActive && hasPending && (
                          <button
                            className="ft-btn-apply"
                            style={{ padding: '3px 8px', fontSize: 10 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmApply();
                            }}
                          >
                            <Check size={11} />
                            <span>Apply Pairing</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Applied History & Saved States */}
          {activeTab === 'history' && (
            <div className="ft-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Applied Typography History (Saved in localStorage)
                </span>
                {historyEntries.length > 0 && (
                  <button
                    className="ft-copy-btn"
                    style={{ position: 'static' }}
                    onClick={() => managerRef.current?.clearHistory()}
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {historyEntries.length === 0 ? (
                <div className="ft-status-card" style={{ textAlign: 'center', padding: 24 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                    No Applied Configurations Yet
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Select a font or pairing in the Channels or Pairings tab and click{' '}
                    <strong style={{ color: '#60a5fa' }}>Apply Options</strong> to save it here.
                  </div>
                </div>
              ) : (
                <div className="ft-font-grid">
                  {historyEntries.map((entry, idx) => (
                    <div
                      key={entry.id}
                      className={`ft-font-card ${idx === 0 && !hasPending ? 'ft-font-card-selected' : ''}`}
                      onClick={() => managerRef.current?.restoreHistoryEntry(entry.id)}
                    >
                      <div className="ft-font-card-top">
                        <span className="ft-font-title">{entry.label}</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {Object.entries(entry.channels).map(([chId, st]) => (
                          <span
                            key={chId}
                            className="ft-mini-tag"
                            style={{
                              borderColor: GROUP_COLORS[chId] || '#334155',
                              color: '#e2e8f0'
                            }}
                          >
                            {chId}: {st.selectedFont || 'Default'}
                            {st.fontSizeScale && st.fontSizeScale !== 1 ? ` (x${st.fontSizeScale})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Detected Project Setup */}
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
                <span className="ft-control-label">Computed Element Fonts & Group Colors</span>
                <div className="ft-code-block" style={{ padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.heading }} />
                    <strong>Headings:</strong> {projectState?.computedFonts.heading || 'None'}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.body }} />
                    <strong>Body & UI:</strong> {projectState?.computedFonts.body || 'None'}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="ft-color-dot" style={{ backgroundColor: GROUP_COLORS.mono }} />
                    <strong>Code / Mono:</strong> {projectState?.computedFonts.mono || 'None'}
                  </div>
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

          {/* Tab 5: Export Code */}
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

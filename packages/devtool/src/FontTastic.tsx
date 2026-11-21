import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
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
  inferFontInfoFromUrl,
  ScopeState,
  ScopeToggleAction,
  ClassTarget,
  cssEscape
} from '@font-tastic/core';
import { DEVTOOL_CSS } from './styles';
import { ScopeOverlay } from './ScopeOverlay';
import {
  X,
  Search,
  Shuffle,
  RotateCcw,
  Check,
  Copy,
  Eye,
  EyeOff,
  SquareDashed,
  Trash2,
  Upload,
  Link,
  Plus,
  Crosshair,
  Hash
} from 'lucide-react';

export interface FontTasticProps {
  initialOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

type TabId = 'browse' | 'targets' | 'pairings' | 'history' | 'detected' | 'export';
type ExportFormat = 'tailwind-v3' | 'tailwind-v4' | 'css-vars' | 'fontsource' | 'nextjs';
type CategoryFilter = FontCategory | 'all' | 'custom';

const UI_STORAGE_KEY = 'font-tastic:ui';

const FALLBACK_COLORS: Record<string, string> = {
  heading: '#3b82f6',
  body: '#a855f7',
  mono: '#10b981'
};

const CHANNELS: { id: string; label: string }[] = [
  { id: 'heading', label: 'Headings' },
  { id: 'body', label: 'Body & UI' },
  { id: 'mono', label: 'Code' }
];

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  custom: 'Imported',
  'sans-serif': 'Sans',
  serif: 'Serif',
  display: 'Display',
  monospace: 'Mono',
  handwriting: 'Script'
};

const CATEGORY_ORDER: CategoryFilter[] = ['all', 'custom', 'sans-serif', 'serif', 'display', 'monospace', 'handwriting'];

const EXPORT_FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'tailwind-v4', label: 'Tailwind v4' },
  { id: 'tailwind-v3', label: 'Tailwind v3' },
  { id: 'css-vars', label: 'CSS variables' },
  { id: 'nextjs', label: 'next/font' },
  { id: 'fontsource', label: 'Fontsource' }
];

const SPACING_RANGE = { min: -4, max: 12 };
const SCALE_RANGE = { min: 60, max: 200 };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function genericFor(category?: FontCategory): string {
  if (category === 'serif') return 'serif';
  if (category === 'monospace') return 'monospace';
  return 'sans-serif';
}

function primaryFamily(stack?: string): string {
  if (!stack) return '';
  return (stack.split(',')[0] || '').trim().replace(/^['"]+|['"]+$/g, '');
}

function parseSpacing(raw?: string): number {
  if (!raw || raw === 'normal') return 0;
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isCustomized(state?: ChannelState): boolean {
  if (!state) return false;
  return Boolean(state.selectedFont || parseSpacing(state.letterSpacing) !== 0 || (state.fontSizeScale ?? 1) !== 1);
}

function sameChannelLook(a?: ChannelState, b?: ChannelState): boolean {
  return (
    (a?.selectedFont || null) === (b?.selectedFont || null) &&
    parseSpacing(a?.letterSpacing) === parseSpacing(b?.letterSpacing) &&
    (a?.fontSizeScale ?? 1) === (b?.fontSizeScale ?? 1)
  );
}

function describeTweaks(state?: ChannelState): string {
  const parts: string[] = [];
  const scale = state?.fontSizeScale ?? 1;
  const spacing = parseSpacing(state?.letterSpacing);
  if (scale !== 1) parts.push(`${Math.round(scale * 100)}%`);
  if (spacing !== 0) parts.push(`${spacing > 0 ? '+' : ''}${spacing}px`);
  return parts.join(', ');
}

function formatSavedTime(timestamp: number): string {
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function readUiState(): { open?: boolean; tab?: TabId; channel?: string } {
  try {
    const raw = window.sessionStorage.getItem(UI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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
      aria-hidden="true"
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

/**
 * Text set in a given family. The font file is only requested once the
 * element scrolls near the viewport, so opening the list does not fetch
 * the whole catalog at once.
 */
function Specimen({
  family,
  category,
  className,
  children
}: {
  family: string;
  category?: FontCategory;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      loadGoogleFont(family);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadGoogleFont(family);
          observer.disconnect();
        }
      },
      { rootMargin: '160px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [family]);

  return (
    <span ref={ref} className={className} style={{ fontFamily: `"${family}", ${genericFor(category)}` }}>
      {children}
    </span>
  );
}

/**
 * Number field whose label can be dragged sideways to scrub the value
 * (double-click the label to reset). Typing is free-form and commits
 * every time the text parses to a number.
 */
function ScrubField({
  label,
  unit,
  value,
  defaultValue,
  min,
  max,
  step,
  pixelsPerStep,
  onChange
}: {
  label: string;
  unit: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  pixelsPerStep: number;
  onChange: (next: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startValue: number } | null>(null);

  const commit = (next: number) => {
    const rounded = Math.round(clamp(next, min, max) / step) * step;
    onChange(Number(rounded.toFixed(2)));
  };

  return (
    <label className="ft-field">
      <span
        className="ft-field-label"
        title={`Drag to adjust ${label.toLowerCase()} · double-click to reset`}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { startX: e.clientX, startValue: value };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const steps = Math.round((e.clientX - drag.current.startX) / pixelsPerStep);
          commit(drag.current.startValue + steps * step);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onDoubleClick={() => {
          setDraft(null);
          onChange(defaultValue);
        }}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={draft ?? String(value)}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parseFloat(e.target.value);
          if (!Number.isNaN(parsed)) commit(parsed);
        }}
        onBlur={() => setDraft(null)}
      />
      <span className="ft-field-unit">{unit}</span>
    </label>
  );
}

export function FontTastic({ initialOpen = false, position = 'bottom-right' }: FontTasticProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<TabId>('browse');
  const [activeChannelId, setActiveChannelId] = useState<string>('heading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exportFramework, setExportFramework] = useState<ExportFormat>('css-vars');
  const [confirmClear, setConfirmClear] = useState(false);
  const [isMac, setIsMac] = useState(false);

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
  const [justApplied, setJustApplied] = useState(false);

  // Element scope and class targets
  const [scope, setScope] = useState<ScopeState>({ mode: 'all', included: [], excluded: [] });
  const [classTargets, setClassTargets] = useState<ClassTarget[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [pickNotice, setPickNotice] = useState<string | null>(null);
  const [focusSelector, setFocusSelector] = useState<string | null>(null);
  const [classInput, setClassInput] = useState('');
  const [classError, setClassError] = useState<string | null>(null);

  const managerRef = useRef<FontOverrideManager | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const openedByUser = useRef(false);

  const syncFromManager = (manager: FontOverrideManager) => {
    setChannelStates(manager.getAllStates());
    setAppliedStates(manager.getAppliedStates());
    setHasPending(manager.hasPendingChanges());
    setOverridesEnabled(manager.isOverridesEnabled());
    setHighlightGroups(manager.isHighlightGroupsEnabled());
    setHistoryEntries(manager.getHistory());
    setScope(manager.getScope());
    setClassTargets(manager.getClassTargets());
  };

  const openDrawer = () => {
    openedByUser.current = true;
    setIsOpen(true);
  };

  const closeDrawer = () => {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
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

    // 1b. Restore where the user left the panel in this browser tab
    const ui = readUiState();
    if (typeof ui.open === 'boolean') setIsOpen(ui.open);
    if (ui.tab) setActiveTab(ui.tab);
    if (ui.channel) setActiveChannelId(ui.channel);
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || ''));

    // 1c. Hydrate and subscribe to custom fonts
    const initialCustom = getCustomFonts();
    setCustomFonts(initialCustom);
    const unsubscribeCustom = subscribeCustomFonts((updated) => {
      setCustomFonts(updated);
    });

    // 2. Detect project typography
    const detected = detectProjectTypography();
    setProjectState(detected);
    setExportFramework(
      detected.tailwindVersion === 'v4' ? 'tailwind-v4' : detected.isTailwindDetected ? 'tailwind-v3' : 'css-vars'
    );

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
        openedByUser.current = true;
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    setMounted(true);

    return () => {
      unsubscribe();
      unsubscribeCustom();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Remember panel state across reloads (per browser tab)
  useEffect(() => {
    if (!mounted) return;
    try {
      window.sessionStorage.setItem(
        UI_STORAGE_KEY,
        JSON.stringify({ open: isOpen, tab: activeTab, channel: activeChannelId })
      );
    } catch {
      // Ignore storage errors
    }
  }, [mounted, isOpen, activeTab, activeChannelId]);

  // Move focus into the panel when the user opens it
  useEffect(() => {
    if (isOpen && openedByUser.current) {
      drawerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setConfirmClear(false);
  }, [activeTab]);

  // Keep the active channel's current font in view when the list is (re)shown
  useEffect(() => {
    if (!isOpen || activeTab !== 'browse') return;
    const list = listRef.current;
    const scroller = list?.parentElement;
    const row = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!scroller) return;
    if (!row) {
      scroller.scrollTop = 0;
      return;
    }
    const rowBox = row.getBoundingClientRect();
    const box = scroller.getBoundingClientRect();
    if (rowBox.top < box.top || rowBox.bottom > box.bottom) {
      scroller.scrollTop += rowBox.top - box.top - (box.height - rowBox.height) / 2;
    }
  }, [isOpen, activeTab, activeChannelId, mounted]);

  const channelColor = (id: string) =>
    projectState?.recommendedChannels.find((c) => c.id === id)?.color ||
    managerRef.current?.getChannels().find((c) => c.id === id)?.color ||
    FALLBACK_COLORS[id] ||
    '#949494';

  // Built-in channels plus one per class target
  const allChannels = useMemo(
    () => [...CHANNELS, ...classTargets.map((t) => ({ id: t.id, label: `.${t.className}` }))],
    [classTargets]
  );

  // Channels to show for a saved entry: the built-ins plus any class it saved
  const entryChannels = (entry: TypographyHistoryEntry) => [
    ...CHANNELS,
    ...Object.keys(entry.channels)
      .filter((id) => id.startsWith('class:'))
      .map((id) => ({ id, label: `.${id.slice('class:'.length)}` }))
  ];

  // If the active class target was removed, fall back to Headings
  useEffect(() => {
    if (mounted && !allChannels.some((c) => c.id === activeChannelId)) {
      setActiveChannelId('heading');
    }
  }, [mounted, allChannels, activeChannelId]);

  // Leaving the panel ends pick mode
  useEffect(() => {
    if (!isOpen) setIsPicking(false);
  }, [isOpen]);

  const handlePicked = useCallback((action: ScopeToggleAction, label: string) => {
    setPickNotice(
      action === 'blocked'
        ? `${label} is inside an ignored area. Click the ignored area to bring it back first.`
        : action === 'exclude'
        ? `Ignored ${label}`
        : action === 'include'
        ? `Selected ${label}`
        : `Unpicked ${label}`
    );
  }, []);

  const stopPicking = useCallback(() => setIsPicking(false), []);

  const handleAddClass = () => {
    if (!managerRef.current) return;
    try {
      const id = managerRef.current.addClassTarget(classInput);
      setClassInput('');
      setClassError(null);
      return id;
    } catch (err) {
      setClassError(err instanceof Error ? err.message : 'That class name could not be added.');
      return undefined;
    }
  };

  const classMatchCount = (className: string) => {
    try {
      return Array.from(document.querySelectorAll(`.${cssEscape(className)}`)).filter(
        (el) => !el.closest('.ft-root')
      ).length;
    } catch {
      return 0;
    }
  };

  const editChannelFonts = (id: string) => {
    setActiveChannelId(id);
    setActiveTab('browse');
  };

  const allFonts = useMemo(() => {
    const customNames = new Set(customFonts.map((cf) => cf.family.toLowerCase()));
    const combined: FontItem[] = [
      ...customFonts,
      ...GOOGLE_FONTS_CATALOG.filter((f) => !customNames.has(f.family.toLowerCase()))
    ];
    return combined;
  }, [customFonts]);

  const fontCategory = (family?: string | null) =>
    family ? allFonts.find((f) => f.family === family)?.category : undefined;

  // Combined & filtered fonts list (Custom fonts first, then Google Fonts catalog)
  const filteredFonts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allFonts.filter((f) => {
      const matchesSearch =
        !query ||
        f.family.toLowerCase().includes(query) ||
        f.category.includes(query) ||
        f.tags?.some((t) => t.toLowerCase().includes(query));

      if (selectedCategory === 'custom') {
        return matchesSearch && Boolean(f.isCustom);
      }
      const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [allFonts, searchQuery, selectedCategory]);

  // Handle file selection for custom font import
  const handleFileChosen = (file: File | null) => {
    setImportError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
      setImportError('That file is not a font. Choose a .woff2, .woff, .ttf or .otf file.');
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

  // Active channel config & state
  const currentChannelState = channelStates.get(activeChannelId);
  const currentAppliedState = appliedStates.get(activeChannelId);
  const activeChannelLabel = allChannels.find((c) => c.id === activeChannelId)?.label || 'channel';

  // Handle selecting a font for live preview
  const handleSelectFont = async (fontFamily: string) => {
    if (!managerRef.current) return;
    setJustApplied(false);
    await managerRef.current.applyFont(activeChannelId, fontFamily);
  };

  // Submit custom font import (file or URL)
  const handleImportSubmit = async () => {
    setImportError(null);
    if (importMode === 'file' && !selectedFile) {
      setImportError('Choose a font file first.');
      return;
    }
    if (importMode === 'url' && !importUrl.trim()) {
      setImportError('Paste a stylesheet URL or a direct link to a font file.');
      return;
    }

    setIsImporting(true);
    try {
      const options = { family: importFamilyName.trim() || undefined, category: importCategory };
      const imported =
        importMode === 'file' && selectedFile
          ? await importFontFromFile(selectedFile, options)
          : await importFontFromUrl(importUrl, options);

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
      setImportError(err instanceof Error ? err.message : 'The font could not be imported.');
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

  // Handle applying a pairing for live preview
  const handleApplyPairing = async (headingFont: string, bodyFont: string) => {
    if (!managerRef.current) return;
    setJustApplied(false);
    await Promise.all([
      managerRef.current.applyFont('heading', headingFont),
      managerRef.current.applyFont('body', bodyFont)
    ]);
  };

  // Commit / Apply the selected options
  const handleConfirmApply = () => {
    if (!managerRef.current) return;
    managerRef.current.applySelectedOptions();
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2600);
  };

  // Discard / Cancel unapplied preview changes
  const handleCancelPreview = () => {
    if (!managerRef.current) return;
    managerRef.current.cancelPendingChanges();
    setJustApplied(false);
  };

  // Shuffle to a pairing other than the one currently showing
  const handleShuffle = () => {
    const heading = channelStates.get('heading')?.selectedFont;
    const body = channelStates.get('body')?.selectedFont;
    const others = CURATED_PAIRINGS.filter((p) => p.headingFont !== heading || p.bodyFont !== body);
    const pool = others.length > 0 ? others : CURATED_PAIRINGS;
    const randomPair = pool[Math.floor(Math.random() * pool.length)];
    if (randomPair) {
      handleApplyPairing(randomPair.headingFont, randomPair.bodyFont);
    }
  };

  // Copy code helper
  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  // Export snippets calculation
  const exportData = useMemo(() => {
    const channelVar = (id: string, fallback: string) =>
      projectState?.recommendedChannels.find((c) => c.id === id)?.targetVar || fallback;

    return generateFontExport({
      headingFont: channelStates.get('heading')?.selectedFont || projectState?.computedFonts.heading || 'Space Grotesk',
      bodyFont: channelStates.get('body')?.selectedFont || projectState?.computedFonts.body || 'Inter',
      monoFont: channelStates.get('mono')?.selectedFont || projectState?.computedFonts.mono || 'JetBrains Mono',
      headingVar: channelVar('heading', '--font-heading'),
      bodyVar: channelVar('body', '--font-body'),
      monoVar: channelVar('mono', '--font-mono')
    });
  }, [channelStates, projectState]);

  // CSS for class targets that have a font, added to every export format
  const classExportCss = useMemo(() => {
    const rules = classTargets
      .map((t) => {
        const st = channelStates.get(t.id);
        if (!st?.selectedFont) return '';
        const generic = genericFor(allFonts.find((f) => f.family === st.selectedFont)?.category);
        const extra = [
          parseSpacing(st.letterSpacing) !== 0 ? `  letter-spacing: ${st.letterSpacing};` : '',
          (st.fontSizeScale ?? 1) !== 1 ? `  font-size: ${st.fontSizeScale}em;` : ''
        ].filter(Boolean);
        return [`.${cssEscape(t.className)} {`, `  font-family: "${st.selectedFont}", ${generic};`, ...extra, '}'].join('\n');
      })
      .filter(Boolean);
    if (rules.length === 0) return '';
    const families = classTargets
      .map((t) => channelStates.get(t.id)?.selectedFont)
      .filter((f): f is string => Boolean(f));
    return [
      `/* Fonts by class. Load ${Array.from(new Set(families)).join(', ')} the same way as the fonts above. */`,
      ...rules
    ].join('\n');
  }, [classTargets, channelStates, allFonts]);

  const exportBlocks: { key: string; code: string }[] = useMemo(() => {
    let base: { key: string; code: string }[];
    switch (exportFramework) {
      case 'tailwind-v3':
        base = [{ key: 'tw3', code: exportData.tailwindV3Snippet }];
        break;
      case 'tailwind-v4':
        base = [{ key: 'tw4', code: exportData.tailwindV4Snippet }];
        break;
      case 'css-vars':
        base = [
          { key: 'html', code: exportData.htmlHeadSnippet },
          { key: 'css', code: exportData.cssVariablesSnippet }
        ];
        break;
      case 'fontsource':
        base = [
          { key: 'fs-cmd', code: exportData.fontsourceInstallCmd },
          { key: 'fs-imp', code: exportData.fontsourceImports }
        ];
        break;
      default:
        base = [{ key: 'next', code: exportData.nextConfigSnippet }];
        break;
    }
    return classExportCss ? [...base, { key: 'classes', code: classExportCss }] : base;
  }, [exportFramework, exportData, classExportCss]);

  // Custom properties only: the detector also reports vendor properties such as -webkit-font-smoothing
  const detectedVariables = useMemo(
    () => (projectState?.cssVariables || []).filter((v) => v.name.startsWith('--') && !v.name.startsWith('--ft-')),
    [projectState]
  );

  // Count channels with an active override
  const activeOverrideCount = useMemo(() => {
    let count = 0;
    channelStates.forEach((st) => {
      if (isCustomized(st)) count++;
    });
    return count;
  }, [channelStates]);

  const numericLetterSpacing = parseSpacing(currentChannelState?.letterSpacing);
  const scalePercent = Math.round((currentChannelState?.fontSizeScale ?? 1) * 100);
  const shortcutLabel = isMac ? '⌘ ⇧ F' : 'Ctrl Shift F';
  const sideClass = position === 'bottom-left' ? 'ft-left' : '';

  // Keyboard handling inside the panel
  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';

    if (e.key === 'Escape') {
      e.stopPropagation();
      if (target === searchRef.current && searchQuery) {
        setSearchQuery('');
      } else if (isImportOpen && activeTab === 'browse') {
        setIsImportOpen(false);
      } else {
        closeDrawer();
      }
      return;
    }

    if (e.key === '/' && !isTyping && activeTab === 'browse') {
      e.preventDefault();
      searchRef.current?.focus();
    }
  };

  // Arrow keys walk the font list and preview each font as they go
  const moveInList = (direction: 1 | -1, fromSearch = false) => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-ft-font]') || []);
    if (rows.length === 0) return;
    const current = rows.findIndex((row) => row === document.activeElement);
    const next = fromSearch ? rows[0] : rows[clamp(current + direction, 0, rows.length - 1)];
    if (!next) return;
    next.focus();
    const family = next.getAttribute('data-ft-font');
    if (family && family !== currentChannelState?.selectedFont) {
      handleSelectFont(family);
    }
  };

  if (!mounted) return null;

  const renderFooter = () => {
    if (hasPending) {
      return (
        <>
          <div className="ft-status ft-status-pending" role="status">
            <span className="ft-dot" style={{ background: 'currentColor' }} />
            <span>Previewing, not saved yet</span>
          </div>
          <div className="ft-footer-actions">
            <button
              type="button"
              className="ft-btn"
              onClick={handleCancelPreview}
              title="Go back to the last applied fonts"
            >
              Discard
            </button>
            <button
              type="button"
              className="ft-btn ft-btn-primary"
              onClick={handleConfirmApply}
              title="Keep these fonts across reloads (saved in this browser)"
            >
              <Check size={14} />
              Apply
            </button>
          </div>
        </>
      );
    }

    if (justApplied) {
      return (
        <div className="ft-status ft-status-saved" role="status">
          <Check size={14} />
          <span>Applied. Saved in this browser.</span>
        </div>
      );
    }

    if (activeOverrideCount > 0) {
      return (
        <>
          <div className="ft-status" role="status">
            <span>
              {overridesEnabled
                ? `${activeOverrideCount} of ${allChannels.length} channels overridden`
                : 'Showing your original fonts'}
            </span>
          </div>
          <div className="ft-footer-actions">
            {!overridesEnabled && (
              <button type="button" className="ft-btn" onClick={() => managerRef.current?.setOverridesEnabled(true)}>
                Show overrides
              </button>
            )}
            <button
              type="button"
              className="ft-btn ft-btn-quiet"
              onClick={() => managerRef.current?.resetAll()}
              title="Remove every override and go back to the project's fonts"
            >
              <RotateCcw size={13} />
              Reset all
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="ft-status">
          <span>Using your project's fonts</span>
        </div>
        <span className="ft-kbd">{shortcutLabel}</span>
      </>
    );
  };

  return (
    <div className="ft-root">
      <ScopeOverlay
        manager={managerRef.current}
        scope={scope}
        picking={isPicking}
        showMarks={isOpen && activeTab === 'targets'}
        focusSelector={focusSelector}
        onStopPicking={stopPicking}
        onPicked={handlePicked}
      />

      {/* Floating trigger */}
      {!isOpen && (
        <button
          ref={triggerRef}
          type="button"
          className={`ft-trigger ${sideClass}`}
          onClick={openDrawer}
          title={`Open Font-Tastic (${shortcutLabel})`}
        >
          <FontTasticLogo size={22} />
          <span>Font-Tastic</span>
          {hasPending ? (
            <span className="ft-trigger-status" style={{ color: 'var(--ft-pending)' }}>
              <span className="ft-dot" style={{ background: 'currentColor' }} />
              Previewing
            </span>
          ) : activeOverrideCount > 0 ? (
            <span className="ft-trigger-status">
              {overridesEnabled ? `${activeOverrideCount} applied` : 'Paused'}
            </span>
          ) : (
            <span className="ft-kbd">{shortcutLabel}</span>
          )}
        </button>
      )}

      {/* Main panel */}
      {isOpen && (
        <div
          ref={drawerRef}
          className={`ft-drawer ${sideClass}`}
          role="dialog"
          aria-label="Font-Tastic typography devtool"
          tabIndex={-1}
          onKeyDown={handleDrawerKeyDown}
        >
          <div className="ft-header">
            <div className="ft-brand">
              <FontTasticLogo size={22} />
              <span>Font-Tastic</span>
              {projectState?.isTailwindDetected && (
                <span className="ft-brand-meta ft-hide-narrow">
                  Tailwind {projectState.tailwindVersion || ''}
                </span>
              )}
            </div>
            <div className="ft-header-actions">
              <button
                type="button"
                className="ft-btn ft-btn-quiet"
                aria-pressed={highlightGroups}
                onClick={() => managerRef.current?.setHighlightGroups(!highlightGroups)}
                title="Outline the text each channel controls on the page"
              >
                <SquareDashed size={14} />
                <span className="ft-hide-narrow">Outlines</span>
              </button>
              <button
                type="button"
                className="ft-btn ft-btn-quiet"
                aria-pressed={!overridesEnabled}
                disabled={activeOverrideCount === 0}
                onClick={() => managerRef.current?.setOverridesEnabled(!overridesEnabled)}
                title={
                  activeOverrideCount === 0
                    ? 'Pick a font first, then use this to compare with the original'
                    : overridesEnabled
                    ? 'Compare: show the page with its original fonts'
                    : 'Back to your overrides'
                }
              >
                {overridesEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                <span className="ft-hide-narrow">Original</span>
              </button>
              <button
                type="button"
                className="ft-btn ft-btn-quiet ft-btn-icon"
                onClick={closeDrawer}
                aria-label="Close Font-Tastic"
                title="Close (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="ft-tabs" role="tablist" aria-label="Font-Tastic sections">
            {(
              [
                ['browse', 'Fonts'],
                ['targets', 'Targets'],
                ['pairings', 'Pairings'],
                ['history', 'Saved'],
                ['detected', 'Detected'],
                ['export', 'Export']
              ] as [TabId, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className="ft-tab"
                onClick={() => setActiveTab(id)}
              >
                {label}
                {id === 'targets' && scope.included.length + scope.excluded.length + classTargets.length > 0 && (
                  <span className="ft-tab-count">
                    {scope.included.length + scope.excluded.length + classTargets.length}
                  </span>
                )}
                {id === 'history' && historyEntries.length > 0 && (
                  <span className="ft-tab-count">{historyEntries.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Fonts */}
          {activeTab === 'browse' && (
            <div className="ft-pane ft-pane-fonts" role="tabpanel" aria-label="Fonts">
              <div className="ft-pane-top">
                {/* Channel switcher: each channel shows its current font, set in that font */}
                <div className="ft-channels">
                  {allChannels.map((channel) => {
                    const font = channelStates.get(channel.id)?.selectedFont;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        className="ft-channel"
                        aria-pressed={activeChannelId === channel.id}
                        onClick={() => setActiveChannelId(channel.id)}
                        title={
                          projectState?.recommendedChannels.find((c) => c.id === channel.id)?.description ||
                          managerRef.current?.getChannels().find((c) => c.id === channel.id)?.description
                        }
                      >
                        <span className="ft-channel-label">
                          <span className="ft-dot" style={{ background: channelColor(channel.id) }} />
                          {channel.label}
                        </span>
                        {font ? (
                          <Specimen family={font} category={fontCategory(font)} className="ft-channel-font">
                            {font}
                          </Specimen>
                        ) : (
                          <span className="ft-channel-font ft-channel-font-default">Project default</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Fine-tuning for the active channel */}
                <div className="ft-row">
                  <ScrubField
                    label="Spacing"
                    unit="px"
                    value={numericLetterSpacing}
                    defaultValue={0}
                    min={SPACING_RANGE.min}
                    max={SPACING_RANGE.max}
                    step={0.5}
                    pixelsPerStep={6}
                    onChange={(next) =>
                      managerRef.current?.updateTypographyParams(activeChannelId, { letterSpacing: `${next}px` })
                    }
                  />
                  <ScrubField
                    label="Size"
                    unit="%"
                    value={scalePercent}
                    defaultValue={100}
                    min={SCALE_RANGE.min}
                    max={SCALE_RANGE.max}
                    step={1}
                    pixelsPerStep={3}
                    onChange={(next) =>
                      managerRef.current?.updateTypographyParams(activeChannelId, {
                        fontSizeScale: Number((next / 100).toFixed(2))
                      })
                    }
                  />
                  <button
                    type="button"
                    className="ft-btn ft-btn-quiet ft-btn-icon"
                    disabled={!isCustomized(currentChannelState)}
                    onClick={() => managerRef.current?.resetChannel(activeChannelId)}
                    aria-label={`Reset ${activeChannelLabel} to the project default`}
                    title={`Reset ${activeChannelLabel} to the project default`}
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>

                {/* Search + import */}
                <div className="ft-row">
                  <div className="ft-search">
                    <Search size={14} />
                    <input
                      ref={searchRef}
                      type="text"
                      className="ft-input"
                      placeholder="Search fonts"
                      aria-label="Search fonts"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'Enter') {
                          e.preventDefault();
                          moveInList(1, true);
                        }
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="ft-search-clear"
                        aria-label="Clear search"
                        onClick={() => {
                          setSearchQuery('');
                          searchRef.current?.focus();
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="ft-btn"
                    aria-expanded={isImportOpen}
                    onClick={() => {
                      setIsImportOpen((prev) => !prev);
                      setImportError(null);
                    }}
                    title="Use your own font file or a font URL"
                  >
                    <Plus size={14} />
                    Import
                  </button>
                </div>

                {/* Category filter */}
                <div className="ft-chips" role="group" aria-label="Filter by category">
                  {CATEGORY_ORDER.map((cat) => {
                    if (cat === 'custom' && customFonts.length === 0) return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className="ft-chip"
                        aria-pressed={selectedCategory === cat}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {CATEGORY_LABELS[cat]}
                        {cat === 'custom' ? ` ${customFonts.length}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ft-scroll">
                {/* Custom font import (file or URL) */}
                {isImportOpen && (
                  <div className="ft-import">
                    <div className="ft-pane-head">
                      <div className="ft-segments" role="group" aria-label="Import source">
                        <button
                          type="button"
                          className="ft-segment"
                          aria-pressed={importMode === 'file'}
                          onClick={() => {
                            setImportMode('file');
                            setImportError(null);
                          }}
                        >
                          <Upload size={13} />
                          File
                        </button>
                        <button
                          type="button"
                          className="ft-segment"
                          aria-pressed={importMode === 'url'}
                          onClick={() => {
                            setImportMode('url');
                            setImportError(null);
                          }}
                        >
                          <Link size={13} />
                          URL
                        </button>
                      </div>
                      <button
                        type="button"
                        className="ft-btn ft-btn-quiet ft-btn-icon ft-btn-sm"
                        onClick={() => setIsImportOpen(false)}
                        aria-label="Close import"
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
                        <button
                          type="button"
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
                          {selectedFile ? (
                            <>
                              <span style={{ fontWeight: 500 }}>{selectedFile.name}</span>
                              <span className="ft-caption ft-num">
                                {(selectedFile.size / 1024).toFixed(1)} KB · choose another
                              </span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontWeight: 500 }}>Drop a font file, or browse</span>
                              <span className="ft-caption">.woff2, .woff, .ttf or .otf</span>
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <label className="ft-label">
                        Stylesheet or font file URL
                        <input
                          type="url"
                          className="ft-input"
                          placeholder="https://api.fontshare.com/v2/css?f[]=satoshi@400,700"
                          value={importUrl}
                          onChange={(e) => handleUrlInputChange(e.target.value)}
                        />
                      </label>
                    )}

                    <div className="ft-import-grid">
                      <label className="ft-label">
                        Family name
                        <input
                          type="text"
                          className="ft-input"
                          placeholder="Satoshi"
                          value={importFamilyName}
                          onChange={(e) => {
                            setImportFamilyName(e.target.value);
                            setImportFamilyTouched(true);
                          }}
                        />
                      </label>
                      <label className="ft-label">
                        Category
                        <select
                          className="ft-select"
                          value={importCategory}
                          onChange={(e) => setImportCategory(e.target.value as FontCategory)}
                        >
                          <option value="sans-serif">Sans-serif</option>
                          <option value="serif">Serif</option>
                          <option value="display">Display</option>
                          <option value="monospace">Monospace</option>
                          <option value="handwriting">Handwriting</option>
                        </select>
                      </label>
                    </div>

                    {importError && (
                      <div className="ft-error" role="alert">
                        {importError}
                      </div>
                    )}

                    <button
                      type="button"
                      className="ft-btn ft-btn-primary"
                      disabled={isImporting}
                      onClick={handleImportSubmit}
                    >
                      {isImporting ? 'Importing…' : `Import and preview on ${activeChannelLabel}`}
                    </button>
                  </div>
                )}

                <div className="ft-list-head">
                  <span className="ft-caption ft-num">
                    {filteredFonts.length} {filteredFonts.length === 1 ? 'font' : 'fonts'} for {activeChannelLabel}
                  </span>
                  {filteredFonts.length > 1 && <span className="ft-kbd ft-hide-narrow">↑ ↓ to preview</span>}
                </div>

                {filteredFonts.length === 0 ? (
                  <div className="ft-empty">
                    <span>
                      No fonts match
                      {searchQuery.trim() ? ` “${searchQuery.trim()}”` : ''}
                      {selectedCategory !== 'all' ? ` in ${CATEGORY_LABELS[selectedCategory]}` : ''}.
                    </span>
                    <button
                      type="button"
                      className="ft-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div
                    ref={listRef}
                    className="ft-list"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        moveInList(e.key === 'ArrowDown' ? 1 : -1);
                      }
                    }}
                  >
                    {filteredFonts.map((font) => {
                      const isSelected = currentChannelState?.selectedFont === font.family;
                      const isApplied = currentAppliedState?.selectedFont === font.family;

                      return (
                        <div key={font.family} className={`ft-item ${isSelected ? 'ft-item-selected' : ''}`}>
                          <button
                            type="button"
                            className="ft-font-row"
                            data-ft-font={font.family}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectFont(font.family)}
                            title={font.tags?.length ? font.tags.join(' · ') : undefined}
                          >
                            <Specimen family={font.family} category={font.category} className="ft-font-name">
                              {font.family}
                            </Specimen>
                            <span className="ft-font-meta">
                              {isSelected && !isApplied ? (
                                <span className="ft-pill ft-pill-preview">Preview</span>
                              ) : isApplied ? (
                                <span className="ft-pill ft-pill-applied">Applied</span>
                              ) : (
                                <span>
                                  {font.isCustom ? 'Imported · ' : ''}
                                  {CATEGORY_LABELS[font.category]}
                                </span>
                              )}
                            </span>
                          </button>
                          {font.isCustom && (
                            <button
                              type="button"
                              className="ft-btn ft-btn-quiet ft-btn-icon ft-btn-sm ft-item-action"
                              aria-label={`Remove imported font ${font.family}`}
                              title={`Remove imported font ${font.family}`}
                              onClick={() => handleRemoveCustomFont(font.family)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Targets (where fonts apply + class targets) */}
          {activeTab === 'targets' && (
            <div className="ft-pane" role="tabpanel" aria-label="Targets">
              <div className="ft-scroll ft-scroll-pad">
                <div className="ft-section-title">Where fonts apply</div>
                <div className="ft-segments ft-target-modes" role="group" aria-label="Where fonts apply">
                  <button
                    type="button"
                    className="ft-segment"
                    aria-pressed={scope.mode === 'all'}
                    onClick={() => managerRef.current?.setScopeMode('all')}
                  >
                    Whole page
                  </button>
                  <button
                    type="button"
                    className="ft-segment"
                    aria-pressed={scope.mode === 'only'}
                    onClick={() => managerRef.current?.setScopeMode('only')}
                  >
                    Only selected
                  </button>
                </div>
                <p className="ft-caption" style={{ margin: '8px 0' }}>
                  {scope.mode === 'all'
                    ? 'Every matching element changes. Pick elements to ignore them.'
                    : 'Only the elements you pick change, along with everything inside them.'}
                </p>

                <div className="ft-target-actions">
                  <button
                    type="button"
                    className="ft-btn"
                    aria-pressed={isPicking}
                    onClick={() => {
                      setPickNotice(null);
                      setIsPicking((prev) => !prev);
                    }}
                    title="Click elements on the page to select or ignore them (Esc to stop)"
                  >
                    <Crosshair size={14} />
                    {isPicking ? 'Stop picking' : scope.mode === 'all' ? 'Pick elements to ignore' : 'Pick elements'}
                  </button>
                  <button
                    type="button"
                    className="ft-btn ft-btn-quiet"
                    disabled={scope.mode === 'all' && scope.excluded.length === 0}
                    onClick={() => managerRef.current?.selectAll()}
                    title="Fonts apply to the whole page again"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="ft-btn ft-btn-quiet"
                    disabled={scope.mode === 'only' && scope.included.length === 0 && scope.excluded.length === 0}
                    onClick={() => managerRef.current?.deselectAll()}
                    title="Fonts apply nowhere until you pick elements"
                  >
                    Deselect all
                  </button>
                </div>

                {isPicking && (
                  <div className="ft-notice" role="status" style={{ marginTop: 8 }}>
                    {pickNotice ||
                      (scope.mode === 'all'
                        ? 'Click anything on the page to ignore it. Click it again to bring it back. Esc stops.'
                        : 'Click anything on the page to select it. Click inside a selection to ignore that part. Esc stops.')}
                  </div>
                )}

                {scope.mode === 'only' && scope.included.length === 0 && !isPicking && (
                  <div className="ft-notice" style={{ marginTop: 8 }}>
                    Nothing is selected, so the page keeps its own fonts.
                  </div>
                )}

                {(scope.mode === 'only' ? [...scope.included, ...scope.excluded] : scope.excluded).length > 0 && (
                  <div className="ft-list" style={{ marginTop: 6 }}>
                    {[
                      ...(scope.mode === 'only' ? scope.included.map((e) => ({ ...e, kind: 'selected' as const })) : []),
                      ...scope.excluded.map((e) => ({ ...e, kind: 'ignored' as const }))
                    ].map((entry) => (
                      <div
                        key={`${entry.kind}:${entry.selector}`}
                        className="ft-item"
                        onMouseEnter={() => setFocusSelector(entry.selector)}
                        onMouseLeave={() => setFocusSelector(null)}
                      >
                        <div className="ft-target-row">
                          <span
                            className="ft-dot"
                            style={{ background: entry.kind === 'selected' ? 'var(--ft-positive)' : 'var(--ft-negative)' }}
                          />
                          <span className="ft-target-name">{entry.label}</span>
                          <span className="ft-target-sub" title={entry.selector}>
                            {entry.selector}
                          </span>
                          <span className="ft-target-side">
                            <span className={`ft-pill ${entry.kind === 'selected' ? 'ft-pill-applied' : 'ft-pill-ignored'}`}>
                              {entry.kind === 'selected' ? 'Selected' : 'Ignored'}
                            </span>
                            <button
                              type="button"
                              className="ft-btn ft-btn-quiet ft-btn-sm ft-btn-icon"
                              aria-label={`Remove ${entry.label}`}
                              title="Remove"
                              onClick={() => {
                                managerRef.current?.removeScopedElement(entry.selector);
                                setFocusSelector(null);
                              }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ft-section-title">Fonts by class</div>
                <p className="ft-caption" style={{ marginBottom: 8 }}>
                  Give any CSS class its own font. It applies to the class and everything inside it, on top of the
                  groups above.
                </p>
                <form
                  className="ft-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddClass();
                  }}
                >
                  <div className="ft-search">
                    <Hash size={14} />
                    <input
                      type="text"
                      className="ft-input"
                      placeholder=".card-title"
                      aria-label="Class name"
                      spellCheck={false}
                      autoCapitalize="off"
                      value={classInput}
                      onChange={(e) => {
                        setClassInput(e.target.value);
                        setClassError(null);
                      }}
                    />
                  </div>
                  <button type="submit" className="ft-btn" disabled={!classInput.trim()}>
                    <Plus size={14} />
                    Add
                  </button>
                </form>
                {classError && (
                  <div className="ft-error" role="alert" style={{ marginTop: 6 }}>
                    {classError}
                  </div>
                )}

                {classTargets.length > 0 && (
                  <div className="ft-list" style={{ marginTop: 6 }}>
                    {classTargets.map((target) => {
                      const font = channelStates.get(target.id)?.selectedFont;
                      const matches = classMatchCount(target.className);
                      return (
                        <div key={target.id} className="ft-item">
                          <div className="ft-target-row">
                            <span className="ft-dot" style={{ background: channelColor(target.id) }} />
                            <span className="ft-target-name ft-mono">.{target.className}</span>
                            <span className="ft-target-sub">
                              {matches === 0 ? 'Not on this page' : `${matches} on this page`}
                              {' · '}
                              {font || 'No font yet'}
                            </span>
                            <span className="ft-target-side">
                              <button
                                type="button"
                                className="ft-btn ft-btn-sm"
                                onClick={() => editChannelFonts(target.id)}
                              >
                                {font ? 'Change font' : 'Choose font'}
                              </button>
                              <button
                                type="button"
                                className="ft-btn ft-btn-quiet ft-btn-sm ft-btn-icon"
                                aria-label={`Remove .${target.className}`}
                                title="Remove this class"
                                onClick={() => managerRef.current?.removeClassTarget(target.id)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Pairings */}
          {activeTab === 'pairings' && (
            <div className="ft-pane" role="tabpanel" aria-label="Pairings">
              <div className="ft-pane-top">
                <div className="ft-pane-head">
                  <span className="ft-caption ft-num">
                    {CURATED_PAIRINGS.length} heading and body pairings
                  </span>
                  <button type="button" className="ft-btn" onClick={handleShuffle}>
                    <Shuffle size={13} />
                    Shuffle
                  </button>
                </div>
              </div>

              <div className="ft-scroll">
                <div className="ft-list">
                  {CURATED_PAIRINGS.map((pairing) => {
                    const isActive =
                      channelStates.get('heading')?.selectedFont === pairing.headingFont &&
                      channelStates.get('body')?.selectedFont === pairing.bodyFont;
                    const isPairingApplied =
                      appliedStates.get('heading')?.selectedFont === pairing.headingFont &&
                      appliedStates.get('body')?.selectedFont === pairing.bodyFont;

                    return (
                      <div key={pairing.id} className={`ft-item ${isActive ? 'ft-item-selected' : ''}`}>
                        <button
                          type="button"
                          className="ft-pairing-row"
                          aria-pressed={isActive}
                          onClick={() => handleApplyPairing(pairing.headingFont, pairing.bodyFont)}
                        >
                          <span className="ft-pairing-top">
                            <Specimen
                              family={pairing.headingFont}
                              category={fontCategory(pairing.headingFont)}
                              className="ft-pairing-heading"
                            >
                              {pairing.headingFont}
                            </Specimen>
                            {isActive && !isPairingApplied ? (
                              <span className="ft-pill ft-pill-preview">Preview</span>
                            ) : isPairingApplied ? (
                              <span className="ft-pill ft-pill-applied">Applied</span>
                            ) : null}
                          </span>
                          <Specimen
                            family={pairing.bodyFont}
                            category={fontCategory(pairing.bodyFont)}
                            className="ft-pairing-body"
                          >
                            {pairing.bodyFont}. {pairing.description}
                          </Specimen>
                          <span className="ft-pairing-meta">
                            {pairing.name} · {pairing.tags.join(', ')}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Saved (applied history) */}
          {activeTab === 'history' && (
            <div className="ft-pane" role="tabpanel" aria-label="Saved">
              {historyEntries.length === 0 ? (
                <div className="ft-scroll ft-scroll-pad">
                  <div className="ft-empty">
                    <span>
                      Nothing saved yet. Every time you press Apply, that set of fonts is kept here so you can
                      come back to it.
                    </span>
                    <button type="button" className="ft-btn" onClick={() => setActiveTab('browse')}>
                      Browse fonts
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ft-pane-top">
                    <div className="ft-pane-head">
                      <span className="ft-caption ft-num">
                        {historyEntries.length} applied {historyEntries.length === 1 ? 'set' : 'sets'}, kept in this
                        browser
                      </span>
                      <button
                        type="button"
                        className="ft-btn ft-btn-quiet ft-btn-sm"
                        onClick={() => {
                          if (confirmClear) {
                            managerRef.current?.clearHistory();
                            setConfirmClear(false);
                          } else {
                            setConfirmClear(true);
                          }
                        }}
                        onBlur={() => setConfirmClear(false)}
                        style={confirmClear ? { color: 'var(--ft-negative)' } : undefined}
                      >
                        <Trash2 size={13} />
                        {confirmClear ? `Delete all ${historyEntries.length}?` : 'Clear'}
                      </button>
                    </div>
                  </div>
                  <div className="ft-scroll">
                    <div className="ft-list">
                      {historyEntries.map((entry) => {
                        const isCurrent =
                          !hasPending &&
                          [...allChannels, ...entryChannels(entry)].every((c) =>
                            sameChannelLook(entry.channels[c.id], appliedStates.get(c.id))
                          );

                        return (
                          <div key={entry.id} className="ft-item">
                            <button
                              type="button"
                              className="ft-saved-row"
                              onClick={() => managerRef.current?.restoreHistoryEntry(entry.id)}
                              disabled={isCurrent}
                              style={isCurrent ? { opacity: 1 } : undefined}
                            >
                              <span className="ft-saved-top">
                                <span className="ft-num">{formatSavedTime(entry.timestamp)}</span>
                                {isCurrent ? (
                                  <span className="ft-pill ft-pill-applied">Current</span>
                                ) : (
                                  <span className="ft-saved-restore">Restore</span>
                                )}
                              </span>
                              <span className="ft-saved-fonts">
                                {entryChannels(entry).map((c) => {
                                  const st = entry.channels[c.id];
                                  const tweaks = describeTweaks(st);
                                  return (
                                    <span
                                      key={c.id}
                                      className={`ft-saved-font ${st?.selectedFont ? '' : 'ft-saved-font-default'}`}
                                      title={c.label}
                                    >
                                      <span className="ft-dot" style={{ background: channelColor(c.id) }} />
                                      <span className="ft-sr-only">{c.label}: </span>
                                      {st?.selectedFont || 'Default'}
                                      {tweaks && <span className="ft-caption ft-num">{tweaks}</span>}
                                    </span>
                                  );
                                })}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 4: Detected project setup */}
          {activeTab === 'detected' && (
            <div className="ft-pane" role="tabpanel" aria-label="Detected">
              <div className="ft-scroll ft-scroll-pad">
                <div className="ft-section-title">What your page uses now</div>
                <div className="ft-kv">
                  <span className="ft-kv-key">Tailwind</span>
                  <span className="ft-kv-value">
                    {projectState?.isTailwindDetected
                      ? `Detected${projectState.tailwindVersion ? `, ${projectState.tailwindVersion}` : ''}`
                      : 'Not detected'}
                  </span>
                </div>
                {CHANNELS.map((c) => {
                  const config = projectState?.recommendedChannels.find((ch) => ch.id === c.id);
                  const stack = projectState?.computedFonts[c.id as 'heading' | 'body' | 'mono'];
                  return (
                    <div key={c.id} className="ft-kv">
                      <span className="ft-kv-key">
                        <span className="ft-dot" style={{ background: channelColor(c.id) }} />
                        {c.label}
                      </span>
                      <span className="ft-kv-value">{primaryFamily(stack) || 'Unknown'}</span>
                      {config && (
                        <span className="ft-kv-sub" title="Elements this channel changes">
                          {config.customSelector || config.defaultSelector}
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="ft-section-title">Font CSS variables on :root</div>
                {detectedVariables.length > 0 ? (
                  detectedVariables.map((v) => (
                    <div key={v.name} className="ft-kv">
                      <span className="ft-kv-key ft-mono">{v.name}</span>
                      <span className="ft-kv-value ft-mono">{v.value}</span>
                    </div>
                  ))
                ) : (
                  <div className="ft-caption">
                    None found. Font-Tastic overrides the elements directly instead, so everything still works.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Export code */}
          {activeTab === 'export' && (
            <div className="ft-pane" role="tabpanel" aria-label="Export">
              <div className="ft-pane-top">
                <div className="ft-chips" role="group" aria-label="Export format">
                  {EXPORT_FORMATS.map((format) => (
                    <button
                      key={format.id}
                      type="button"
                      className="ft-chip"
                      aria-pressed={exportFramework === format.id}
                      onClick={() => setExportFramework(format.id)}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
                <span className="ft-caption">
                  {activeOverrideCount === 0
                    ? 'No overrides yet, so this is your current setup. Pick fonts and the code updates.'
                    : hasPending
                    ? 'Includes the fonts you are previewing.'
                    : 'Paste this into your project to make the applied fonts permanent.'}
                </span>
              </div>
              <div className="ft-scroll">
                {exportBlocks.map((block, index) => (
                  <div key={block.key} className="ft-code" style={index === 0 ? { marginTop: 0 } : undefined}>
                    <button
                      type="button"
                      className="ft-btn ft-btn-sm ft-code-copy"
                      onClick={() => handleCopy(block.key, block.code)}
                    >
                      {copiedKey === block.key ? <Check size={13} /> : <Copy size={13} />}
                      {copiedKey === block.key ? 'Copied' : 'Copy'}
                    </button>
                    <pre>{block.code}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ft-footer">{renderFooter()}</div>
        </div>
      )}
    </div>
  );
}

import { FontTastic } from '@font-tastic/devtool';
import {
  Sparkles,
  ArrowRight,
  Terminal,
  CheckCircle,
  Zap,
  Code2
} from 'lucide-react';

export function App() {

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-lg text-white">
              Aa
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Font<span className="text-blue-500">-Tastic</span>
            </span>
            <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              v0.1.0-alpha
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg font-mono">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded font-semibold text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded font-semibold text-[10px]">Shift</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-slate-700 text-slate-200 rounded font-semibold text-[10px]">F</kbd>
            </div>
            <a
              href="#pricing"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium mb-6">
            <Sparkles size={13} className="text-blue-400" />
            <span>Interactive Typography Devtool for Web Projects</span>
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-[1.1] mb-6">
            Preview, Pair & Perfect <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400">
              Fonts On Your Real UI
            </span>
          </h1>

          <p className="font-sans text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            No more copying stylesheets, editing configs, or guessing how a font looks on your layout.
            Inspect, test Google Fonts live on-the-fly, and export with 1 click.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/25 flex items-center gap-2">
              <span>Try In-App Devtool</span>
              <ArrowRight size={16} />
            </button>
            <a
              href="#docs"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 text-slate-200 border border-slate-800 font-semibold text-sm transition flex items-center gap-2"
            >
              <Code2 size={16} className="text-slate-400" />
              <span>Read Documentation</span>
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <div className="font-heading font-bold text-2xl text-white">100+</div>
              <div className="text-xs text-slate-400 mt-1">Google Fonts Built-in</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <div className="font-heading font-bold text-2xl text-blue-400">0ms</div>
              <div className="text-xs text-slate-400 mt-1">Zero Rebuild Time</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <div className="font-heading font-bold text-2xl text-indigo-400">Auto</div>
              <div className="text-xs text-slate-400 mt-1">Tailwind CSS Detection</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <div className="font-heading font-bold text-2xl text-emerald-400">100%</div>
              <div className="text-xs text-slate-400 mt-1">Open Source & Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Component Showcase: Typography in Action */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white tracking-tight">
            Realistic Component Canvas
          </h2>
          <p className="font-sans text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Open the Font-Tastic drawer in the bottom right to change headings, body copy, and code in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: SaaS Feature Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-2">
                Lightning Fast HMR Bridge
              </h3>
              <p className="font-sans text-slate-400 text-sm leading-relaxed mb-6">
                Font-Tastic updates your root CSS variables and DOM rules instantly. There is never any layout shift
                or browser reload required while you test styles.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Category: Performance</span>
              <span className="text-blue-400 font-semibold">Active Engine →</span>
            </div>
          </div>

          {/* Card 2: Editorial / Article Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-blue-400 font-medium mb-3">
                <Sparkles size={12} />
                <span>EDITORIAL ESSAY</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-white mb-3">
                The Psychological Weight of Typography in Digital Products
              </h3>
              <p className="font-sans text-slate-400 text-sm leading-relaxed mb-4">
                Typefaces are the body language of written words. The subtle arc of a serif or the sterile precision
                of a monospaced character drastically influences trust, authority, and brand tone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                P
              </div>
              <div className="text-xs">
                <div className="text-slate-200 font-medium">Pedro Dev</div>
                <div className="text-slate-500">Design Systems Engineer</div>
              </div>
            </div>
          </div>

          {/* Card 3: Code & Monospace Preview Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Terminal size={14} className="text-emerald-400" />
                  <span>terminal.sh</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <h3 className="font-heading font-bold text-lg text-white mb-2">
                Drop Into Any Project
              </h3>
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                <div className="text-slate-500">// 1. Install via pnpm</div>
                <div className="text-emerald-400">$ pnpm add -D font-tastic</div>
                <div className="text-slate-500 mt-2">// 2. Drop in your root</div>
                <div>&lt;<span className="text-blue-400">FontTastic</span> /&gt;</div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
              <span>Target: code, pre</span>
              <span className="text-emerald-400">--font-mono</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="py-16 max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl text-white">
            100% Free & Open Source
          </h2>
          <p className="font-sans text-slate-400 text-sm mt-2">
            Built for developers and designers who love clean typography.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-blue-400 font-semibold">
                Community Edition
              </span>
              <h3 className="font-heading font-bold text-2xl text-white mt-1">
                Font-Tastic Core & Devtool
              </h3>
              <p className="font-sans text-slate-400 text-sm mt-1">
                Full access to all Google Fonts, pairings, and export generators.
              </p>
            </div>
            <div className="text-right">
              <div className="font-heading font-black text-4xl text-white">$0</div>
              <div className="text-xs text-slate-400">Forever MIT License</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-6">
            {[
              'Automatic Tailwind CSS v3 & v4 detection',
              'CSS Variable discovery & non-destructive override',
              'Independent Headings, Body, and Code channels',
              'Curated typography pairings + instant shuffle',
              '1-click export for Tailwind, @fontsource, and Next.js',
              'Zero production bundle footprint (dev-only)'
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle size={15} className="text-blue-500 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20">
              Start Using in Your App
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>Font-Tastic — The in-app typography studio for modern web projects.</p>
      </footer>

      {/* The Star of the Show: In-App Font-Tastic Devtool Widget */}
      <FontTastic initialOpen={false} position="bottom-right" />
    </div>
  );
}

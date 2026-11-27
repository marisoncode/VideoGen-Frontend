import React from 'react';
import { Film, Key, Zap, CheckCircle2, Sparkles, Cloud } from 'lucide-react';

export default function Header({
  groqConfigured,
  replicateConfigured = false,
  cloudflareConfigured = false,
  onOpenReplicateModal,
  onOpenCloudflareModal
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-300 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 transition">
      <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-2">
        {/* Brand & Studio Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 border border-blue-700 flex items-center justify-center text-white shrink-0 shadow-none">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-base font-bold tracking-tight text-slate-900 truncate">
                MIWAY <span className="text-blue-600 font-semibold hidden xs:inline">Video application</span>
              </span>
              <span className="text-[9px] sm:text-[11px] font-mono uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 font-semibold shrink-0">
                1080p
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium hidden sm:block truncate">
              Autonomous Multi-Agent AI Video Studio
            </p>
          </div>
        </div>

        {/* Center: Pipeline Indicator (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-mono text-slate-700 font-semibold">Multi-Agent Engine Online</span>
        </div>

        {/* Right Actions: API Connection Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Cloudflare Workers AI (100% Free Daily FLUX) */}
          <button
            type="button"
            onClick={onOpenCloudflareModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-semibold border transition ${
              cloudflareConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-orange-50 text-orange-900 border-orange-300 hover:bg-orange-100'
            }`}
            title="Cloudflare Workers AI: 10,000 free Neurons/day ($0 FLUX)"
          >
            <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0" />
            <span className="hidden xs:inline">{cloudflareConfigured ? 'CF FLUX (Free Active)' : 'Cloudflare AI (Free FLUX)'}</span>
            <span className="xs:hidden">{cloudflareConfigured ? 'CF FLUX' : 'CF Free'}</span>
          </button>

          {/* Groq Screenwriter Status */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-300 text-[10px] sm:text-xs font-mono">
            <Zap className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${groqConfigured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
            <span className="font-semibold">{groqConfigured ? 'Groq Active' : 'Groq Standby'}</span>
          </div>

          {/* Replicate Status & Settings Modal Button */}
          <button
            type="button"
            onClick={onOpenReplicateModal}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border transition ${
              replicateConfigured
                ? 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
            }`}
          >
            {replicateConfigured ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-mono text-slate-800 hidden xs:inline">Replicate Connected</span>
                <span className="font-mono text-slate-800 xs:hidden">Replicate</span>
              </>
            ) : (
              <>
                <Key className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-100 shrink-0" />
                <span className="hidden xs:inline">Replicate API</span>
                <span className="xs:hidden">Replicate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

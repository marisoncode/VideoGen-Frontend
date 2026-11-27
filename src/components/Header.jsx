import React from 'react';
import { Clapperboard, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function Header({
  groqConfigured,
  replicateConfigured = false,
  cloudflareConfigured = false,
  onOpenReplicateModal,
  onOpenCloudflareModal
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_1px_12px_-2px_rgba(15,23,42,0.06)] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-all">
      <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-3">
        {/* Brand & Studio Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="flex items-center shrink-0">
            <img
              src="/miway-logo.png"
              alt="MIWAY Logo"
              className="h-8 sm:h-10 w-auto object-contain shrink-0"
            />
          </div>
          <div className="hidden sm:block h-7 w-px bg-slate-200 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 truncate">
                MIWAY <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold hidden xs:inline">Video application</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white font-semibold shrink-0 shadow-xs">
                1080p HD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block truncate">
              Autonomous Multi-Agent AI Video Studio
            </p>
          </div>
        </div>

        {/* Center: Live Engine Pill (Desktop only) */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-xs text-emerald-900 shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-semibold tracking-tight">Multi-Agent Engine Online</span>
        </div>

        {/* Right Actions: Agent Status Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          {/* Script Agent (Groq) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
              groqConfigured
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80'
                : 'bg-transparent text-slate-500'
            }`}
            title={groqConfigured ? 'Script Agent (Groq): Active' : 'Script Agent (Groq): Standby'}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${groqConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <FileText className={`w-3.5 h-3.5 shrink-0 ${groqConfigured ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="tracking-tight">Script Agent</span>
          </div>

          {/* Image Agent (Cloudflare FLUX) */}
          <button
            type="button"
            onClick={onOpenCloudflareModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
              cloudflareConfigured
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80 hover:border-blue-300 hover:text-blue-700'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
            title="Configure Image Agent (Cloudflare Workers AI)"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cloudflareConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <ImageIcon className={`w-3.5 h-3.5 shrink-0 ${cloudflareConfigured ? 'text-blue-600' : 'text-amber-600'}`} />
            <span className="tracking-tight">Image Agent</span>
          </button>

          {/* Video Agent (Replicate) */}
          <button
            type="button"
            onClick={onOpenReplicateModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold transition-all cursor-pointer ${
              replicateConfigured
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/80 hover:border-indigo-300 hover:text-indigo-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs'
            }`}
            title="Configure Video Agent (Replicate)"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${replicateConfigured ? 'bg-emerald-500' : 'bg-blue-200'}`} />
            <Clapperboard className={`w-3.5 h-3.5 shrink-0 ${replicateConfigured ? 'text-indigo-600' : 'text-white'}`} />
            <span className="tracking-tight">Video Agent</span>
          </button>
        </div>
      </div>
    </header>
  );
}

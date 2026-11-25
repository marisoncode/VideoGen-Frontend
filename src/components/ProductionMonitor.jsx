import React, { useState, useEffect } from 'react';
import {
  Download,
  Loader2,
  Film,
  Clapperboard,
  Clock,
  Play
} from 'lucide-react';
import { apiUrl } from '../api';

export default function ProductionMonitor({ config, externalJobId, onRenderingFinished }) {
  const [jobId, setJobId] = useState(externalJobId || null);
  const [jobStatus, setJobStatus] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);

  useEffect(() => {
    if (externalJobId) {
      setJobId(externalJobId);
      setGenerating(true);
      setJobStatus({ status: 'PROCESSING', progress_pct: 10, step_message: 'Initializing 1080p production pipeline...' });
      setOutputVideoUrl(null);
    }
  }, [externalJobId]);

  useEffect(() => {
    if (!jobId || !generating) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/v1/videos/status/${jobId}`));
        if (!res.ok) return;
        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'COMPLETED') {
          setGenerating(false);
          setOutputVideoUrl(apiUrl(data.download_url));
          if (onRenderingFinished) onRenderingFinished();
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setGenerating(false);
          if (onRenderingFinished) onRenderingFinished();
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, generating, onRenderingFinished]);

  const progressPct = jobStatus?.progress_pct || 0;

  return (
    <div className="bg-white border border-slate-300 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              03
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Final 1080p Video Player & Downloads
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Master 1080p Full HD production with synchronized neural voice narration, ducked soundtrack, and burned subtitles.
          </p>
        </div>

        <span className="text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md shrink-0">
          1080p Full HD • 16:9 Cinema
        </span>
      </div>

      {/* 16:9 Video Display Container with Extra Height */}
      <div className="w-full max-w-5xl mx-auto aspect-video min-h-[380px] sm:min-h-[460px] md:min-h-[520px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700 relative flex items-center justify-center shadow-xl">
        {outputVideoUrl ? (
          <video
            src={outputVideoUrl}
            controls
            autoPlay
            className="w-full h-full object-contain bg-black"
          />
        ) : generating ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin shrink-0" />
            <div className="space-y-1">
              <span className="text-sm sm:text-base font-bold text-white block">
                {jobStatus?.step_message || 'Rendering Video Scenes...'}
              </span>
              <span className="text-xs font-mono text-blue-300">
                {progressPct}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              ></div>
            </div>
            <span className="text-[11px] text-slate-400">Synthesizing audio, mixing music & burning subtitles...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
            <Film className="w-12 h-12 opacity-50 text-slate-500" />
            <div className="space-y-1">
              <span className="text-sm sm:text-base font-bold text-slate-200 block">
                Master 1080p Video Theater
              </span>
              <span className="text-xs text-slate-400 block max-w-sm">
                Approve scenes in Step 02 above and click "Approve Storyboard & Render" to view and download your full video here.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Status when generating */}
      {generating && (
        <div className="max-w-5xl mx-auto bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-2 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            Render Pipeline Status
          </div>
          <div className="space-y-1 text-xs font-mono text-slate-700">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-blue-700">{jobStatus?.status || 'PROCESSING'}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Stage:</span>
              <span className="truncate max-w-md text-right text-slate-900 font-medium">{jobStatus?.step_message || 'Processing'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display if any */}
      {jobStatus?.status === 'FAILED' && (
        <div className="max-w-5xl mx-auto p-3.5 bg-red-50 border border-red-300 rounded-lg text-xs sm:text-sm text-red-800 font-medium">
          <strong>Production Failed:</strong> {jobStatus.error || 'Unknown rendering error'}
        </div>
      )}

      {/* Download Button when completed */}
      {outputVideoUrl && (
        <div className="pt-2 flex justify-center">
          <a
            href={outputVideoUrl}
            download="video_1080p.mp4"
            className="w-full max-w-md py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 border border-emerald-700 shadow-md active:scale-95"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Download 1080p Full HD MP4</span>
          </a>
        </div>
      )}
    </div>
  );
}

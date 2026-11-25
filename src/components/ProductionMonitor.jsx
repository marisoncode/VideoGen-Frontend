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
    <div className="bg-white border border-slate-300 rounded-xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-blue-600 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Video Output & Player
          </h2>
        </div>
        <span className="text-[10px] sm:text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
          1080p Full HD
        </span>
      </div>

      {/* 16:9 Video Display Container */}
      <div className="aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-300 relative flex items-center justify-center">
        {outputVideoUrl ? (
          <video
            src={outputVideoUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : generating ? (
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-2 sm:space-y-3 max-w-sm">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 animate-spin shrink-0" />
            <div className="space-y-1">
              <span className="text-xs sm:text-sm font-medium text-white block">
                {jobStatus?.step_message || 'Rendering Video Scenes...'}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-blue-300">
                {progressPct}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-2 text-slate-400">
            <Film className="w-7 h-7 sm:w-8 sm:h-8 opacity-60 text-slate-400" />
            <div className="space-y-0.5">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                Master Video Preview
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 block max-w-[220px]">
                Approve scenes to render and download your finalized 1080p MP4.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Status when generating */}
      {generating && (
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
            Render Pipeline
          </div>
          <div className="space-y-1 text-[11px] font-mono text-slate-700">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-blue-700">{jobStatus?.status || 'PROCESSING'}</span>
            </div>
            <div className="flex justify-between">
              <span>Stage:</span>
              <span className="truncate max-w-[180px] sm:max-w-[220px] text-right text-slate-900 font-medium">{jobStatus?.step_message || 'Processing'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display if any */}
      {jobStatus?.status === 'FAILED' && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-800 font-medium">
          <strong>Production Failed:</strong> {jobStatus.error || 'Unknown rendering error'}
        </div>
      )}

      {/* Download Button when completed */}
      {outputVideoUrl && (
        <a
          href={outputVideoUrl}
          download="video_1080p.mp4"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-2 border border-emerald-700 shadow-none"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Download 1080p MP4</span>
        </a>
      )}
    </div>
  );
}

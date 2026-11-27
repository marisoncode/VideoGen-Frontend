import React, { useState, useEffect } from 'react';
import { apiUrl } from '../api';
import {
  Check,
  RefreshCw,
  Upload,
  Sparkles,
  Trash2,
  Plus,
  Play,
  Volume2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  Video,
  Clapperboard,
  Camera,
  Layers,
  Type,
  Clock,
  Timer,
  Maximize2,
  X,
  ExternalLink,
  UserCheck,
  History,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ApprovalBoard({
  config,
  onChangeConfig,
  onApproveAndRender,
  isRendering,
  musicTracks = [],
  voices = []
}) {
  const [regeneratingIdx, setRegeneratingIdx] = useState(null);
  const [editingPromptIdx, setEditingPromptIdx] = useState(null);
  const [customPromptText, setCustomPromptText] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isBatchRendering, setIsBatchRendering] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  const scenes = config.scenes || [];

  const handleSceneChange = (index, field, value) => {
    const updated = [...scenes];
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      onChangeConfig({
        ...config,
        scenes: updated
      });
    }
  };

  const handleOpenPromptEditor = (index) => {
    setEditingPromptIdx(index);
    setCustomPromptText(scenes[index]?.image_prompt || '');
  };

  const handleRegenerateImage = async (index) => {
    const scene = scenes[index];
    if (!scene) return;

    const sNum = scene.scene_number || index + 1;
    const isCurrentEditor = editingPromptIdx === index;
    const promptToUse = (isCurrentEditor && customPromptText.trim())
      ? customPromptText.trim()
      : (scene.image_prompt || `Scene ${sNum} visual`);

    setRegeneratingIdx(index);

    try {
      const res = await fetch(apiUrl('/api/v1/studio/regenerate-image'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_index: sNum,
          image_prompt: promptToUse
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to regenerate image (${res.status})`);
      }

      const data = await res.json();
      const updated = [...scenes];
      const curHistory = data.image_history || updated[index]?.image_history || [];

      updated[index] = {
        ...updated[index],
        image_path: data.image_path,
        preview_url: data.preview_url,
        image_prompt: promptToUse,
        image_provider: data.provider,
        image_history: curHistory,
        image_error: null
      };

      onChangeConfig({
        ...config,
        scenes: updated
      });

      setEditingPromptIdx(null);
      setCustomPromptText('');
    } catch (err) {
      console.error('Error regenerating image:', err);
      alert(`Could not regenerate image: ${err.message}`);
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const handleBatchRenderAllKeyframes = async () => {
    if (isBatchRendering || regeneratingIdx !== null) return;
    setIsBatchRendering(true);

    let currentScenes = [...scenes];
    setBatchProgress({ current: 0, total: currentScenes.length });

    for (let i = 0; i < currentScenes.length; i++) {
      const s = currentScenes[i];
      const sNum = s.scene_number || i + 1;
      const promptToUse = s.image_prompt || `Scene ${sNum} visual`;

      setBatchProgress({ current: i + 1, total: currentScenes.length });
      setRegeneratingIdx(i);

      try {
        const res = await fetch(apiUrl('/api/v1/studio/regenerate-image'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene_index: sNum,
            image_prompt: promptToUse
          })
        });

        if (res.ok) {
          const data = await res.json();
          const existingHist = Array.isArray(currentScenes[i].image_history) ? [...currentScenes[i].image_history] : [];
          const curHistory = data.image_history && data.image_history.length > 0
            ? data.image_history
            : [...existingHist, {
                preview_url: data.preview_url,
                image_path: data.image_path,
                image_prompt: promptToUse,
                image_provider: data.provider,
                label: `Version ${existingHist.length + 1}`
              }];

          currentScenes[i] = {
            ...currentScenes[i],
            image_path: data.image_path,
            preview_url: data.preview_url,
            image_provider: data.provider,
            image_error: null,
            image_history: curHistory
          };

          onChangeConfig({
            ...config,
            scenes: [...currentScenes]
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          currentScenes[i] = {
            ...currentScenes[i],
            image_error: errData.detail || 'Generation failed'
          };
          onChangeConfig({
            ...config,
            scenes: [...currentScenes]
          });
        }
      } catch (err) {
        console.error(`Error rendering scene ${sNum}:`, err);
      }
    }

    setRegeneratingIdx(null);
    setIsBatchRendering(false);
  };

  const handleSelectVersion = (sceneIndex, versionIdx) => {
    const scene = scenes[sceneIndex];
    if (!scene || !scene.image_history || !scene.image_history[versionIdx]) return;
    const targetVersion = scene.image_history[versionIdx];
    const updated = [...scenes];
    updated[sceneIndex] = {
      ...updated[sceneIndex],
      image_path: targetVersion.image_path,
      preview_url: targetVersion.preview_url,
      image_prompt: targetVersion.image_prompt || updated[sceneIndex].image_prompt,
      image_provider: targetVersion.image_provider || updated[sceneIndex].image_provider
    };
    onChangeConfig({
      ...config,
      scenes: updated
    });
  };

  const handleCustomImageUpload = (index, file) => {
    if (!file) return;

    setUploadingIdx(index);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const previewUrl = e.target.result;
        const updated = [...scenes];
        const existingHist = Array.isArray(updated[index].image_history) ? [...updated[index].image_history] : [];
        if (updated[index].preview_url && !existingHist.some(h => h.preview_url === updated[index].preview_url)) {
          existingHist.push({
            preview_url: updated[index].preview_url,
            image_path: updated[index].image_path || '',
            image_prompt: updated[index].image_prompt || '',
            label: `Version ${existingHist.length + 1}`
          });
        }
        existingHist.push({
          preview_url: previewUrl,
          image_path: '',
          image_prompt: 'Custom user upload',
          label: `Version ${existingHist.length + 1} (Upload)`
        });

        updated[index] = {
          ...updated[index],
          preview_url: previewUrl,
          image_provider: 'custom_upload',
          image_history: existingHist
        };

        onChangeConfig({
          ...config,
          scenes: updated
        });
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploadingIdx(null);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveScene = (index) => {
    const updated = scenes.filter((_, i) => i !== index);
    const renumbered = updated.map((s, i) => ({
      ...s,
      scene_number: i + 1
    }));
    onChangeConfig({
      ...config,
      scenes: renumbered
    });
  };

  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene = {
      scene_number: nextNum,
      title: `Scene ${nextNum}`,
      speaker_name: '',
      narration: 'Next concept narration text...',
      subtitle: 'Next concept subtitle caption...',
      image_prompt: 'Cinematic widescreen scene keyframe illustration, 16:9 composition',
      motion_prompt: 'Natural eye blinking, gentle smile, conversational posture',
      motion_style: 'zoom_in',
      estimated_duration: 15
    };
    onChangeConfig({
      ...config,
      scenes: [...scenes, newScene]
    });
  };

  const totalWords = scenes.reduce((acc, s) => {
    return acc + (s.narration ? s.narration.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);
  const totalEstimatedSeconds = Math.round(totalWords / 2.3);

  // If there are no scenes yet, show clean empty state
  if (scenes.length === 0) {
    return (
      <div className="bg-white border-2 border-indigo-200/90 border-t-4 border-t-indigo-600 rounded-2xl p-6 sm:p-10 md:p-12 text-center space-y-3.5 sm:space-y-4 shadow-[0_6px_24px_-6px_rgba(79,70,229,0.12)] ring-1 ring-indigo-100/80">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xs">
          <Clapperboard className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-indigo-600 text-white">
              Step 02
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">Storyboard Review</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Choose your target duration and style in <strong className="text-slate-800">Step 01</strong> above, then click <strong className="text-blue-700">Generate Autonomous Storyboard</strong> to draft scenes and keyframes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-indigo-200/90 border-t-4 border-t-indigo-600 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6 shadow-[0_6px_24px_-6px_rgba(79,70,229,0.14)] ring-1 ring-indigo-100/80 transition-all">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 -mx-4 sm:-mx-5 md:-mx-6 -mt-4 sm:-mt-5 md:-mt-6 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 pb-3.5 sm:pb-4 rounded-t-xl bg-gradient-to-r from-indigo-50/95 via-purple-50/45 to-transparent border-b border-indigo-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs shrink-0">
              Step 02
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Storyboard Review
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review keyframes, adjust dialogue text, and inspect camera motion before 1080p rendering.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {config.target_duration && (
            <span className="text-[11px] sm:text-xs font-mono font-semibold bg-amber-50 text-amber-900 px-2 sm:px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Target: {config.target_duration}s</span>
            </span>
          )}

          <span className="text-[11px] sm:text-xs font-mono font-medium text-slate-700 bg-slate-50 px-2 sm:px-2.5 py-1 rounded-md border border-slate-300">
            {scenes.length} {scenes.length === 1 ? 'Scene' : 'Scenes'} {totalEstimatedSeconds > 0 && `• ~${totalEstimatedSeconds}s total`}
          </span>

          {/* Master Batch Render All Keyframes Button */}
          {scenes.length > 0 && (
            <button
              type="button"
              disabled={isBatchRendering || regeneratingIdx !== null}
              onClick={handleBatchRenderAllKeyframes}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition active:scale-95 border ${
                scenes.filter(s => !(s.preview_url || s.image_path)).length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              } ${isBatchRendering ? 'opacity-90 cursor-wait' : ''}`}
              title="Render all scene keyframes sequentially with FLUX"
            >
              {isBatchRendering ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Rendering Keyframe {batchProgress.current} of {batchProgress.total}...</span>
                </>
              ) : scenes.filter(s => !(s.preview_url || s.image_path)).length > 0 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>✨ Render All Keyframes ({scenes.filter(s => !(s.preview_url || s.image_path)).length} Pending)</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Re-render All ({scenes.length})</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleAddScene}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Scene Cards Sequence */}
      <div className="space-y-4">
        {scenes.map((scene, index) => {
          const sNum = scene.scene_number || index + 1;
          const isRegen = regeneratingIdx === index;
          const isUpload = uploadingIdx === index;
          const isEditingPrompt = editingPromptIdx === index;
          const wordCount = scene.narration ? scene.narration.trim().split(/\s+/).filter(Boolean).length : 0;
          const sceneDuration = scene.estimated_duration || Math.max(5, Math.round(wordCount / 2.3));
          const hasHistory = Array.isArray(scene.image_history) && scene.image_history.length > 1;
          const currentIdx = hasHistory
            ? (() => {
                const idx = scene.image_history.findIndex(h =>
                  h.preview_url === scene.preview_url ||
                  (h.image_path && scene.image_path && h.image_path === scene.image_path)
                );
                return idx >= 0 ? idx : scene.image_history.length - 1;
              })()
            : 0;

          return (
            <div
              key={index}
              className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs"
            >
              {/* Scene Card Header - Mobile responsive wrap */}
              <div className="bg-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <span className="font-mono text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded tracking-wide shrink-0">
                    SCENE {sNum < 10 ? `0${sNum}` : sNum}
                  </span>
                  <input
                    type="text"
                    value={scene.title || `Scene ${sNum}`}
                    onChange={(e) => handleSceneChange(index, 'title', e.target.value)}
                    className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white px-2 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition flex-1 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Source Reference Badge if extracted */}
                  {scene.source_reference && scene.source_reference.trim() && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded px-2 py-0.5 text-[10px] sm:text-[11px] font-mono text-amber-900" title={`Textbook Reference: ${scene.source_reference}`}>
                      <Layers className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="max-w-[130px] truncate">{scene.source_reference}</span>
                    </div>
                  )}

                  {/* Speaker Badge Pill if Configured */}
                  {scene.speaker_name && scene.speaker_name.trim() && (
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-300 rounded px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-800" title={`Speaker Badge: ${scene.speaker_name}`}>
                      <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="max-w-[130px] truncate">{scene.speaker_name}</span>
                    </div>
                  )}

                  {/* Estimated Scene Duration Badge */}
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-0.5 text-[10px] sm:text-[11px] font-mono text-slate-700">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>~{sceneDuration}s ({wordCount}w)</span>
                  </div>

                  {/* Camera Movement Pill */}
                  <div className="flex items-center gap-1 bg-white border border-slate-300 rounded px-2 py-0.5">
                    <Camera className="w-3 h-3 text-blue-600 shrink-0" />
                    <select
                      value={scene.motion_style || 'zoom_in'}
                      onChange={(e) => handleSceneChange(index, 'motion_style', e.target.value)}
                      className="text-[10px] sm:text-[11px] bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
                    >
                      <option value="zoom_in">Push-In (Zoom)</option>
                      <option value="zoom_out">Pull-Back</option>
                      <option value="pan_right">Pan Right</option>
                      <option value="pan_left">Pan Left</option>
                    </select>
                  </div>

                  {/* Delete Scene Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveScene(index)}
                    title="Delete Scene"
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-white transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scene Card Body */}
              <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
                {/* Left: 16:9 Image Preview */}
                <div className="md:col-span-5 space-y-2 sm:space-y-2.5">
                  <div className="aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-300 relative flex items-center justify-center group">
                    {(() => {
                      const activePreviewUrl = scene.preview_url || (scene.image_path ? (scene.image_path.startsWith('/static/') ? scene.image_path : `/static/uploads/${scene.image_path.split(/[\\/]/).pop()}`) : null);
                      return activePreviewUrl ? (
                      <div
                        className="w-full h-full relative cursor-pointer overflow-hidden"
                        onClick={() => setFullscreenImage({
                          url: activePreviewUrl,
                          title: scene.title || `Scene ${sNum}`,
                          sNum: sNum,
                          prompt: scene.image_prompt || '',
                          sceneIndex: index
                        })}
                        title="Click to view full-resolution image"
                      >
                        <img
                          src={apiUrl(activePreviewUrl)}
                          alt={`Scene ${sNum}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <div className="bg-black/75 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-white/20 shadow-lg">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>View Full Size</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 p-4 text-center">
                        <ImageIcon className="w-7 h-7 opacity-50 text-slate-400" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-slate-200 block">Keyframe Pending</span>
                          <span className="text-[10px] text-slate-400 block max-w-[200px]">
                            {scene.image_error ? scene.image_error : "Prompt ready. Click below to render keyframe."}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isRegen || isBatchRendering}
                          onClick={() => handleRegenerateImage(index)}
                          className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                          title="Generate 16:9 keyframe via FLUX"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                          <span>Render Keyframe</span>
                        </button>
                      </div>
                    );
                  })()}

                    {/* Floating Left / Right Arrow Navigation Overlay on Image */}
                    {hasHistory && !isRegen && !isUpload && (
                      <>
                        <button
                          type="button"
                          disabled={currentIdx <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentIdx > 0) handleSelectVersion(index, currentIdx - 1);
                          }}
                          className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                            currentIdx <= 0
                              ? 'bg-black/25 text-white/30 cursor-not-allowed opacity-0 group-hover:opacity-30'
                              : 'bg-black/75 hover:bg-black/95 text-white hover:scale-110 active:scale-95 cursor-pointer border border-white/25'
                          }`}
                          title={currentIdx > 0 ? `Switch to Version ${currentIdx}` : 'Earliest version'}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          disabled={currentIdx >= scene.image_history.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentIdx < scene.image_history.length - 1) handleSelectVersion(index, currentIdx + 1);
                          }}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                            currentIdx >= scene.image_history.length - 1
                              ? 'bg-black/25 text-white/30 cursor-not-allowed opacity-0 group-hover:opacity-30'
                              : 'bg-black/75 hover:bg-black/95 text-white hover:scale-110 active:scale-95 cursor-pointer border border-white/25'
                          }`}
                          title={currentIdx < scene.image_history.length - 1 ? `Switch to Version ${currentIdx + 2}` : 'Latest version'}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow z-10 flex items-center gap-1">
                          <span>v{currentIdx + 1}/{scene.image_history.length}</span>
                        </div>
                      </>
                    )}

                    {isRegen && (
                      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 p-3 text-center z-30">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-xs font-semibold">Generating Keyframe...</span>
                      </div>
                    )}

                    {isUpload && (
                      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 p-3 text-center z-30">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-xs font-semibold">Uploading...</span>
                      </div>
                    )}

                    {scene.preview_url && !isRegen && (
                      <div className="absolute top-2 left-2 bg-slate-900/80 border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded font-mono font-medium z-10">
                        16:9 Keyframe
                      </div>
                    )}
                  </div>

                  {/* Left / Right Arrow Carousel Bar & Version Switcher */}
                  {hasHistory && (
                    <div className="bg-slate-50 border border-slate-300 rounded-lg p-2 space-y-2 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          disabled={currentIdx <= 0}
                          onClick={() => handleSelectVersion(index, currentIdx - 1)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
                            currentIdx <= 0
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300 active:scale-95 shadow-2xs'
                          }`}
                          title="Previous Image Version"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-blue-600" />
                          <span>Prev</span>
                        </button>

                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <span>Version {currentIdx + 1} of {scene.image_history.length}</span>
                          {currentIdx === 0 && (
                            <span className="text-[9px] font-sans font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                              Original
                            </span>
                          )}
                          {currentIdx === scene.image_history.length - 1 && (
                            <span className="text-[9px] font-sans font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200">
                              Latest
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={currentIdx >= scene.image_history.length - 1}
                          onClick={() => handleSelectVersion(index, currentIdx + 1)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border transition ${
                            currentIdx >= scene.image_history.length - 1
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-slate-200 text-slate-800 border-slate-300 active:scale-95 shadow-2xs'
                          }`}
                          title="Next Image Version"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                      </div>

                      {/* Direct Jump Chips */}
                      <div className="flex items-center justify-center gap-1.5 pt-0.5 flex-wrap">
                        {scene.image_history.map((ver, vIdx) => {
                          const isCurrent = (vIdx === currentIdx);
                          return (
                            <button
                              key={vIdx}
                              type="button"
                              onClick={() => handleSelectVersion(index, vIdx)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center gap-1 border ${
                                isCurrent
                                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs scale-105'
                                  : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                              }`}
                              title={`Jump directly to Version ${vIdx + 1}${vIdx === 0 ? ' (Original)' : ''}`}
                            >
                              <span>v{vIdx + 1}</span>
                              {isCurrent && <Check className="w-2.5 h-2.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Visual Controls under Keyframe Preview */}
                  <div className="flex items-center gap-2">
                    {!scene.preview_url ? (
                      <button
                        type="button"
                        disabled={isRegen || isBatchRendering}
                        onClick={() => handleRegenerateImage(index)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 transition active:scale-95 shadow-xs"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-blue-200 shrink-0 ${isRegen ? 'animate-spin' : ''}`} />
                        <span>{isRegen ? 'Rendering Keyframe...' : '✨ Render Keyframe'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isRegen || isBatchRendering}
                        onClick={() => handleRegenerateImage(index)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition active:scale-95 shadow-2xs"
                        title="Re-render keyframe using the prompt"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-blue-600 shrink-0 ${isRegen ? 'animate-spin' : ''}`} />
                        <span>{isRegen ? 'Re-rendering...' : '🔄 Re-render Keyframe'}</span>
                      </button>
                    )}

                    <label className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 cursor-pointer transition shrink-0">
                      <Upload className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleCustomImageUpload(index, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>

                {/* Right: Visual Prompt, Spoken Script, Badges */}
                <div className="md:col-span-7 space-y-2.5 sm:space-y-3">
                  {/* Pedagogical Concept Summary */}
                  {scene.concept_summary && scene.concept_summary.trim() && (
                    <div className="text-[11px] font-medium text-blue-900 bg-blue-50/80 border border-blue-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                      <span className="font-bold text-blue-700 shrink-0">Concept:</span>
                      <span className="truncate">{scene.concept_summary}</span>
                    </div>
                  )}

                  {/* 1. Visual Scene Direction (Image Prompt) - Always Readable By Default, Editable on Click */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Visual Scene Direction (Image Prompt)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {isEditingPrompt ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleSceneChange(index, 'image_prompt', customPromptText);
                              setEditingPromptIdx(null);
                              setCustomPromptText('');
                            }}
                            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded transition shadow-2xs"
                          >
                            <Check className="w-3 h-3 text-blue-600" />
                            <span>Done Editing</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenPromptEditor(index)}
                            className="text-xs font-semibold text-slate-700 hover:text-blue-700 flex items-center gap-1 bg-slate-100 hover:bg-blue-50 border border-slate-300 hover:border-blue-300 px-2.5 py-0.5 rounded transition shadow-2xs"
                          >
                            <span>✏️ Edit Prompt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditingPrompt ? (
                      <div className="space-y-2 animate-in fade-in duration-100">
                        <textarea
                          rows={4}
                          value={customPromptText}
                          onChange={(e) => setCustomPromptText(e.target.value)}
                          className="w-full bg-white border-2 border-blue-600 rounded-lg p-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none leading-relaxed shadow-xs"
                          placeholder="Describe character visual action, environment, lighting, and camera angle..."
                          autoFocus
                        />
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Adjust characters, actions, or lighting, then save or re-render.
                          </span>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPromptIdx(null);
                                setCustomPromptText('');
                              }}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSceneChange(index, 'image_prompt', customPromptText);
                                setEditingPromptIdx(null);
                              }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                            >
                              Save Prompt
                            </button>
                            <button
                              type="button"
                              disabled={isRegen || isBatchRendering}
                              onClick={() => handleRegenerateImage(index)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{scene.preview_url ? 'Re-render' : 'Render'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleOpenPromptEditor(index)}
                        className="w-full bg-slate-50/80 hover:bg-slate-100/90 border border-slate-300 hover:border-slate-400 rounded-lg p-2.5 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed cursor-pointer transition select-text min-h-[75px] max-h-[140px] overflow-y-auto"
                        title="Click anywhere to edit prompt"
                      >
                        {scene.image_prompt || 'Visual prompt crafted by DesignAgent.'}
                      </div>
                    )}
                  </div>

                  {/* Spoken Narration */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Spoken Narration (Voiceover)</span>
                      </label>
                      <span className="font-mono text-[11px] text-slate-500">
                        {wordCount} words {sceneDuration > 0 && `(~${sceneDuration}s)`}
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={scene.narration || ''}
                      onChange={(e) => handleSceneChange(index, 'narration', e.target.value)}
                      placeholder="Voiceover script spoken by the neural voice..."
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition leading-relaxed"
                    />
                  </div>

                  {/* Speaker / Name Card Badge (Optional) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Speaker / Name Card Badge <span className="font-normal text-slate-500 text-[11px]">(Optional)</span></span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                        Overlays badge in video for this scene
                      </span>
                    </div>
                    <input
                      type="text"
                      value={scene.speaker_name || ''}
                      onChange={(e) => handleSceneChange(index, 'speaker_name', e.target.value)}
                      placeholder="e.g. Dr. Ananya Sharma • Lead Educator (or leave empty if no badge)"
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtitle Customization Panel */}
      <div className="bg-gradient-to-br from-violet-50/75 via-white to-slate-50 border-2 border-violet-200/90 border-l-4 border-l-violet-600 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-[0_4px_18px_-4px_rgba(124,58,237,0.12)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-violet-200/80">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-6 h-6 rounded-md bg-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Type className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Subtitle Styling & Font
            </span>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              Zero Shadow / Transparent Background
            </span>
          </div>
          <span className="text-xs font-medium text-violet-700 bg-violet-100/70 px-2.5 py-0.5 rounded-md border border-violet-200">
            Burned dynamically into 1080p MP4
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Font Family
            </label>
            <select
              value={config.subtitle_font || 'Arial'}
              onChange={(e) => onChangeConfig({ ...config, subtitle_font: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="Arial">Arial (Clean & Modern)</option>
              <option value="Segoe UI">Segoe UI (Crisp & Readable)</option>
              <option value="Trebuchet MS">Trebuchet MS (Cinematic)</option>
              <option value="Verdana">Verdana (Wide & High Contrast)</option>
              <option value="Georgia">Georgia (Classic Storybook)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Text Color & Preset
            </label>
            <select
              value={config.subtitle_style || 'clean_white'}
              onChange={(e) => onChangeConfig({ ...config, subtitle_style: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="clean_white">Clean White (Pure White, Zero Shadow, No Box)</option>
              <option value="cinema_yellow">Cinema Yellow (Warm Gold, Zero Shadow, No Box)</option>
              <option value="disabled">Disabled (No On-Screen Subtitles)</option>
            </select>
          </div>
        </div>

        {/* Live Subtitle Preview */}
        {config.subtitle_style !== 'disabled' && (
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3 text-center border border-slate-700 flex items-center justify-center min-h-[44px]">
            <span
              style={{
                fontFamily: config.subtitle_font || 'Arial',
                color: config.subtitle_style === 'cinema_yellow' ? '#FFFF00' : '#FFFFFF',
                textShadow: '0 0 2px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9)'
              }}
              className="text-xs sm:text-sm font-bold tracking-wide"
            >
              "Once upon a time, a clever fox watched from beneath the banyan tree..."
            </span>
          </div>
        )}
      </div>

      {/* Approve & Render Action Bar */}
      <div className="pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
          Ready to produce final video: Voice synthesis + Ducked soundtrack + Animated motion + 1080p MP4 assembly.
        </div>

        <button
          type="button"
          disabled={isRendering || scenes.length === 0}
          onClick={onApproveAndRender}
          className={`w-full sm:w-auto px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 border shadow-none shrink-0 ${
            isRendering || scenes.length === 0
              ? 'bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 active:scale-[0.99]'
          }`}
        >
          {isRendering ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Rendering 1080p Video...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 shrink-0" />
              <span>Approve Storyboard & Render 1080p Video</span>
            </>
          )}
        </button>
      </div>

      {/* Full-Resolution Image Lightbox Modal */}
      {fullscreenImage && (() => {
        const modalScene = fullscreenImage.sceneIndex != null ? scenes[fullscreenImage.sceneIndex] : null;
        const modalHistory = Array.isArray(modalScene?.image_history) ? modalScene.image_history : [];
        const modalIdx = modalHistory.length > 1
          ? modalHistory.findIndex(h => h.preview_url === fullscreenImage.url)
          : -1;

        const handleModalNav = (newIdx) => {
          if (newIdx < 0 || newIdx >= modalHistory.length) return;
          handleSelectVersion(fullscreenImage.sceneIndex, newIdx);
          setFullscreenImage({
            ...fullscreenImage,
            url: modalHistory[newIdx].preview_url,
            prompt: modalHistory[newIdx].image_prompt || fullscreenImage.prompt
          });
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setFullscreenImage(null)}
          >
            <div
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center bg-[#0B0F19] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="w-full px-4 py-3 bg-[#111724] border-b border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded shrink-0">
                    SCENE {fullscreenImage.sNum < 10 ? `0${fullscreenImage.sNum}` : fullscreenImage.sNum}
                  </span>
                  <h3 className="text-sm font-bold truncate text-slate-100">
                    {fullscreenImage.title}
                  </h3>
                  {modalHistory.length > 1 && modalIdx >= 0 && (
                    <span className="font-mono text-[11px] font-bold bg-slate-800 border border-slate-700 text-blue-400 px-2 py-0.5 rounded ml-1 shrink-0">
                      Version {modalIdx + 1} of {modalHistory.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={apiUrl(fullscreenImage.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title="Open in new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open Original</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setFullscreenImage(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Close (Esc)"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image Display */}
              <div className="w-full p-2 sm:p-4 flex items-center justify-center bg-black/95 overflow-auto max-h-[78vh] relative">
                {modalHistory.length > 1 && (
                  <>
                    <button
                      type="button"
                      disabled={modalIdx <= 0}
                      onClick={() => handleModalNav(modalIdx - 1)}
                      className={`absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${
                        modalIdx <= 0
                          ? 'bg-slate-900/30 text-slate-600 cursor-not-allowed border border-slate-800'
                          : 'bg-black/80 hover:bg-black text-white hover:scale-110 active:scale-95 cursor-pointer border border-white/20'
                      }`}
                      title="Previous Image Version"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      disabled={modalIdx >= modalHistory.length - 1}
                      onClick={() => handleModalNav(modalIdx + 1)}
                      className={`absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${
                        modalIdx >= modalHistory.length - 1
                          ? 'bg-slate-900/30 text-slate-600 cursor-not-allowed border border-slate-800'
                          : 'bg-black/80 hover:bg-black text-white hover:scale-110 active:scale-95 cursor-pointer border border-white/20'
                      }`}
                      title="Next Image Version"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <img
                  src={apiUrl(fullscreenImage.url)}
                  alt={fullscreenImage.title}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded shadow-lg"
                />
              </div>

              {/* Lightbox Footer Prompt description */}
              {fullscreenImage.prompt && (
                <div className="w-full px-4 py-2.5 bg-[#111724] border-t border-slate-800 text-xs text-slate-300 font-mono flex items-center justify-between gap-3">
                  <span className="truncate text-slate-400">
                    <strong className="text-slate-200">Prompt:</strong> {fullscreenImage.prompt}
                  </span>
                  <span className="text-[11px] text-blue-400 font-semibold shrink-0">16:9 Full HD</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

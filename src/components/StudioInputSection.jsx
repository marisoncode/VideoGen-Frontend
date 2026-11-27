import React, { useState } from 'react';
import { apiUrl } from '../api';
import {
  FileText,
  Clapperboard,
  Upload,
  FileUp,
  Music,
  Mic,
  Palette,
  AlertCircle,
  Loader2,
  Sliders,
  Globe,
  Clock,
  Timer,
  User,
  Compass,
  Info
} from 'lucide-react';

export default function StudioInputSection({
  onStoryboardGenerated,
  voices = [],
  selectedVoice,
  onSelectVoice,
  selectedMusic,
  onSelectMusic,
  musicTracks = [],
  designStyles = [],
  selectedDesignStyle,
  onSelectDesignStyle
}) {
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' | 'script' | 'file' | 'google'
  const [topicPrompt, setTopicPrompt] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [googleUrl, setGoogleUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [chapterTopic, setChapterTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Middle School (Grade 6-8)');

  // Target Video Duration: 2 to 5 minutes default
  const [targetDuration, setTargetDuration] = useState(120);
  const [customDurationInput, setCustomDurationInput] = useState('120');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  // Character & Environment
  const [customCharacter, setCustomCharacter] = useState('');
  const [customEnvironment, setCustomEnvironment] = useState('');
  const [showAdvancedDesign, setShowAdvancedDesign] = useState(false);

  // Reference Audio
  const [referenceAudioFile, setReferenceAudioFile] = useState(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState(null);
  const [referenceAudioName, setReferenceAudioName] = useState(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // Status
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentNotice, setCurrentNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const samplePrompts = [
    { label: 'Space Physics', prompt: 'How gravity and orbital mechanics keep satellites and planets in orbit' },
    { label: 'Plant Biology', prompt: 'How green plant leaves convert sunlight and water into energy through photosynthesis' },
    { label: 'History of AI', prompt: 'The evolution of artificial intelligence from Turing machines to neural networks' },
    { label: 'Economics', prompt: 'How central banks use interest rates to balance inflation and economic growth' }
  ];

  const handleDocFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleReferenceAudioUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploadingAudio(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(apiUrl('/api/v1/studio/upload-reference-audio'), {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Failed to upload audio reference');

      const data = await res.json();
      setReferenceAudioFile(file);
      setReferenceAudioUrl(apiUrl(data.preview_url));
      setReferenceAudioName(file.name);
      onSelectVoice(data.voice_id);
    } catch (err) {
      console.error('Audio upload error:', err);
      setErrorMsg(`Audio upload failed: ${err.message}`);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    setErrorMsg(null);

    if (activeTab === 'prompt' && !topicPrompt.trim()) {
      setErrorMsg('Please enter a topic prompt or choose one of the suggestions below.');
      return;
    }
    if (activeTab === 'script' && !scriptText.trim()) {
      setErrorMsg('Please paste or write your script content.');
      return;
    }
    if (activeTab === 'file' && !uploadedFile) {
      setErrorMsg('Please choose a document file to parse.');
      return;
    }
    if (activeTab === 'google' && !googleUrl.trim()) {
      setErrorMsg('Please enter a public Google Docs or Sheets URL.');
      return;
    }

    setIsGenerating(true);
    setCurrentNotice('Analyzing topic & structuring scene sequence...');

    try {
      const formData = new FormData();
      formData.append('design_style', selectedDesignStyle || 'pixar_3d');
      formData.append('custom_character', customCharacter);
      formData.append('custom_environment', customEnvironment);
      formData.append('voice', selectedVoice || 'Reference Voice Clone (100% Match)');
      formData.append('background_music', selectedMusic || 'inspiring_educational');
      formData.append('target_duration', targetDuration || 120);
      formData.append('generate_images', 'false');
      formData.append('chapter_topic', chapterTopic.trim());
      formData.append('target_audience', targetAudience.trim());

      if (activeTab === 'file' && uploadedFile) {
        formData.append('input_mode', 'document');
        formData.append('file', uploadedFile);
      } else if (activeTab === 'google') {
        formData.append('input_mode', 'google_url');
        formData.append('live_url', googleUrl.trim());
      } else if (activeTab === 'script') {
        formData.append('input_mode', 'script');
        formData.append('script_text', scriptText);
      } else {
        formData.append('input_mode', 'prompt');
        formData.append('topic_prompt', topicPrompt);
      }

      setCurrentNotice('Screenwriting storyboard scenes with Groq LLM...');
      const response = await fetch(apiUrl('/api/v1/studio/create-storyboard'), {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error (${response.status})`);
      }

      setCurrentNotice('Crafting visual scene prompts & framing...');
      const data = await response.json();

      if (data && data.scenes) {
        onStoryboardGenerated(data);
      } else {
        throw new Error('Invalid storyboard response received from server.');
      }
    } catch (err) {
      console.error('Storyboard generation error:', err);
      setErrorMsg(err.message || 'Failed to generate storyboard.');
    } finally {
      setIsGenerating(false);
      setCurrentNotice('');
    }
  };

  const scriptWordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const targetWords = Math.round(targetDuration * 2.3);
  const estimatedScenesCount = targetDuration <= 35 ? '2' : targetDuration <= 75 ? '3-4' : targetDuration <= 110 ? '4-5' : targetDuration <= 160 ? '6-7' : `${Math.max(6, Math.round(targetDuration / 20))}-${Math.max(7, Math.round(targetDuration / 18))}`;

  return (
    <div className="bg-white border-2 border-blue-200/90 border-t-4 border-t-blue-600 rounded-2xl p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 transition-all shadow-[0_6px_24px_-6px_rgba(37,99,235,0.14)] ring-1 ring-blue-100/80">
      {/* Header with Step Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 -mx-4 sm:-mx-5 md:-mx-6 -mt-4 sm:-mt-5 md:-mt-6 px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 pb-3.5 sm:pb-4 rounded-t-xl bg-gradient-to-r from-blue-50/95 via-indigo-50/50 to-transparent border-b border-blue-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-blue-600 text-white shadow-xs shrink-0">
              Step 01
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Production Setup & Scripting
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Choose your video pacing, format, visual art style, and topic description.
          </p>
        </div>

        {/* Input Mode Selector - Mobile 2x2 grid, Desktop row */}
        <div className="grid grid-cols-2 xs:flex sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-300 text-xs font-semibold w-full sm:w-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-center transition ${
              activeTab === 'prompt'
                ? 'bg-white text-blue-700 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Topic Prompt
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md flex items-center justify-center gap-1.5 text-center transition ${
              activeTab === 'google'
                ? 'bg-white text-blue-700 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Google Docs / Sheets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-center transition ${
              activeTab === 'script'
                ? 'bg-white text-blue-700 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Paste Script
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-center transition ${
              activeTab === 'file'
                ? 'bg-white text-blue-700 font-bold border border-slate-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {/* Target Video Duration & Dynamic Planning */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Target Video Duration
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-slate-700 bg-slate-50 border border-slate-300 px-2.5 sm:px-3 py-1 rounded-md w-full sm:w-auto justify-between sm:justify-start">
            <span>Duration: <strong className="text-slate-900">{targetDuration}s</strong> ({Math.floor(targetDuration / 60)}m {targetDuration % 60}s)</span>
            <span className="text-slate-400 hidden xs:inline">•</span>
            <span>Target Structure: <strong className="text-blue-700 font-semibold">~{estimatedScenesCount} scenes</strong> (~{targetWords} words)</span>
          </div>
        </div>

        {/* Duration Grid Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { sec: 60, label: '60s (1 min)', desc: '~3-4 scenes' },
            { sec: 120, label: '2 Minutes', desc: '~6-7 scenes' },
            { sec: 180, label: '3 Minutes', desc: '~8-9 scenes' },
            { sec: 240, label: '4 Minutes', desc: '~10-11 scenes' },
            { sec: 300, label: '5 Minutes', desc: '~12-14 scenes' },
            { sec: 'custom', label: 'Custom', desc: 'Exact Seconds' }
          ].map((preset) => {
            const isSelected = preset.sec === 'custom' ? isCustomDuration : (!isCustomDuration && targetDuration === preset.sec);
            return (
              <button
                key={String(preset.sec)}
                type="button"
                onClick={() => {
                  if (preset.sec === 'custom') {
                    setIsCustomDuration(true);
                  } else {
                    setIsCustomDuration(false);
                    setTargetDuration(preset.sec);
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-lg border text-left transition ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-700 font-bold'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{preset.label}</div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {preset.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Duration Input */}
        {isCustomDuration && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <Timer className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <label className="font-semibold text-slate-700">Exact Duration (Seconds):</label>
              <input
                type="number"
                min="15"
                max="600"
                step="5"
                value={customDurationInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDurationInput(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed) && parsed >= 15 && parsed <= 600) {
                    setTargetDuration(parsed);
                  }
                }}
                className="w-20 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
              <span className="text-slate-500 font-mono text-[11px]">(Range: 15s to 600s)</span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Input Container */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        {/* TAB 1: Topic Prompt */}
        {activeTab === 'prompt' && (
          <div className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800 block">
              Topic or Subject Description
            </label>
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="e.g. How the James Webb Space Telescope captures infrared light from early galaxies..."
              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            />
            {/* Quick Starters */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-600 font-medium">Suggestions:</span>
              {samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTopicPrompt(item.prompt)}
                  className="text-[11px] sm:text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-300 text-slate-700 px-2.5 py-1 rounded-md transition font-medium"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Paste Script */}
        {activeTab === 'script' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <label className="font-bold text-slate-800">
                Script Content
              </label>
              <span className="font-mono text-xs text-blue-700 font-semibold">
                {scriptWordCount} words
              </span>
            </div>
            <textarea
              rows={5}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste or write your full script here. The AI will segment it into scenes calibrated to your target duration..."
              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition font-mono leading-relaxed"
            />
          </div>
        )}

        {/* TAB 3: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-1">
              <label className="font-bold text-slate-800">Textbook Document Upload</label>
              <span className="font-mono text-[11px] sm:text-xs text-slate-500">PDF, Word, Excel, CSV, TXT</span>
            </div>
            <div className="border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-slate-50 rounded-lg p-5 sm:p-6 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.md"
                onChange={handleDocFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileUp className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
              {uploadedFile ? (
                <div className="text-xs sm:text-sm font-semibold text-slate-900">
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-slate-600">
                  Click or drag your textbook PDF here to extract lesson content
                </div>
              )}
            </div>

            {/* Chapter / Topic & Target Grade fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Chapter or Specific Topic <span className="font-normal text-slate-500 text-[11px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={chapterTopic}
                  onChange={(e) => setChapterTopic(e.target.value)}
                  placeholder="e.g. Chapter 4: Photosynthesis or Unit 2: Cell Structure"
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Target School Grade / Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
                >
                  <option value="Primary School (Grade 1-5)">Primary School (Grade 1-5)</option>
                  <option value="Middle School (Grade 6-8)">Middle School (Grade 6-8)</option>
                  <option value="High School (Grade 9-10)">High School (Grade 9-10)</option>
                  <option value="Higher Secondary (Grade 11-12)">Higher Secondary (Grade 11-12)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Google Cloud */}
        {activeTab === 'google' && (
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-slate-800 block">
              Google Docs or Google Sheets URL
            </label>
            <input
              type="url"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/... (publicly viewable link)"
              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 transition font-mono"
            />
          </div>
        )}
      </div>

      {/* Visual Art Direction */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Visual Art Style
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedDesign(!showAdvancedDesign)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{showAdvancedDesign ? 'Hide Character Anchor' : 'Custom Character & Setting'}</span>
            <span className="xs:hidden">{showAdvancedDesign ? 'Hide' : 'Custom'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'pixar_3d', name: '3D Pixar', tag: 'Disney 3D' },
            { id: 'cinematic_realistic', name: 'Cinematic', tag: '35mm Film' },
            { id: 'anime_ghibli', name: 'Studio Ghibli', tag: 'Anime' },
            { id: 'claymation', name: 'Claymation', tag: 'Stop-Motion' },
            { id: 'storybook_watercolor', name: 'Watercolor', tag: 'Storybook' },
            { id: 'cyberpunk_scifi', name: 'Sci-Fi', tag: 'Volumetric' }
          ].map((style) => {
            const isSelected = selectedDesignStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onSelectDesignStyle(style.id)}
                className={`p-2.5 sm:p-3 rounded-lg border text-left transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold border-2'
                    : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs sm:text-sm font-semibold">{style.name}</div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-blue-700 font-semibold' : 'text-slate-500'}`}>
                  {style.tag}
                </div>
              </button>
            );
          })}
        </div>

        {showAdvancedDesign && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Character Anchor (Optional)</label>
              <input
                type="text"
                value={customCharacter}
                onChange={(e) => setCustomCharacter(e.target.value)}
                placeholder="e.g. Young female scientist wearing glasses and white lab coat"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Environment & Setting (Optional)</label>
              <input
                type="text"
                value={customEnvironment}
                onChange={(e) => setCustomEnvironment(e.target.value)}
                placeholder="e.g. Modern high-tech physics laboratory with hologram displays"
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Audio & Voice Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-200">
        {/* Voice Selection */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Voice Narration</span>
            </div>
            {referenceAudioName && (
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded font-semibold truncate max-w-[150px]">
                Custom Reference
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div className="sm:col-span-7">
              <select
                value={selectedVoice}
                onChange={(e) => onSelectVoice(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium truncate"
              >
                {referenceAudioUrl && (
                  <option value={selectedVoice}>
                    ★ Cloned Voice ({referenceAudioName})
                  </option>
                )}
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.locale || 'Studio AI'})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-5">
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-800 cursor-pointer transition font-medium">
                {isUploadingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span className="truncate">{referenceAudioName ? 'Replace Voice' : 'Upload Audio (.wav)'}</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a"
                  onChange={handleReferenceAudioUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Music Track */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-300 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">Soundtrack & Audio Ducking</span>
          </div>
          <select
            value={selectedMusic}
            onChange={(e) => onSelectMusic(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-medium truncate"
          >
            {musicTracks.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-600 text-center sm:text-left">
          {isGenerating ? (
            <span className="flex items-center justify-center sm:justify-start gap-2 text-blue-700 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
              {currentNotice}
            </span>
          ) : (
            <span>Instant AI Screenplay: review dialogue, timing & visual prompts before rendering keyframes.</span>
          )}
        </div>

        <button
          type="button"
          disabled={isGenerating}
          onClick={handleGenerateStoryboard}
          className={`w-full sm:w-auto px-5 sm:px-7 py-3 rounded-xl text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-none shrink-0 ${
            isGenerating
              ? 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] border border-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>Drafting Storyboard Scenes...</span>
            </>
          ) : (
            <>
              <Clapperboard className="w-4 h-4 shrink-0" />
              <span>Draft Storyboard & Prompts (Instant)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import StudioInputSection from './components/StudioInputSection';
import ApprovalBoard from './components/ApprovalBoard';
import ProductionMonitor from './components/ProductionMonitor';
import ReplicateApiKeyModal from './components/ReplicateApiKeyModal';
import CloudflareApiKeyModal from './components/CloudflareApiKeyModal';

export default function App() {
  const [config, setConfig] = useState({
    title: '',
    voice: 'Reference Voice Clone (100% Match)',
    background_music: 'inspiring_educational',
    design_style: 'cinematic_realistic',
    target_duration: 120,
    subtitle_font: 'Arial',
    subtitle_style: 'clean_white',
    scenes: []
  });

  const [voices, setVoices] = useState([
    { id: 'Reference Voice Clone (100% Match)', name: 'Reference Voice Clone', locale: 'Natural Voice Clone' },
    { id: 'en-IN-NeerjaNeural', name: 'Neerja', locale: 'Indian English Clear' },
    { id: 'en-US-JennyNeural', name: 'Jenny', locale: 'US English Warm' },
    { id: 'en-US-GuyNeural', name: 'Guy', locale: 'US English Clear' }
  ]);
  const [selectedVoice, setSelectedVoice] = useState('Reference Voice Clone (100% Match)');

  const [musicTracks, setMusicTracks] = useState([
    { id: 'inspiring_educational', name: 'Inspiring Acoustic', description: 'Uplifting warm acoustic background' },
    { id: 'gentle_lofi', name: 'Gentle Lofi Atmosphere', description: 'Smooth, relaxed ambient warmth' },
    { id: 'playful_curiosity', name: 'Playful Curiosity', description: 'Bright, cheerful learning atmosphere' },
    { id: 'none', name: 'No Soundtrack', description: 'Pure spoken voice only' }
  ]);
  const [selectedMusic, setSelectedMusic] = useState('inspiring_educational');

  const [designStyles, setDesignStyles] = useState([
    { id: 'cinematic_realistic', name: 'Realistic Educational Cinema' },
    { id: 'pixar_3d', name: '3D Pixar Animation' },
    { id: 'storybook_watercolor', name: 'Vintage Watercolor' },
    { id: 'anime_ghibli', name: 'Studio Ghibli Anime' },
    { id: 'claymation', name: 'Claymation Stop-Motion' },
    { id: 'cyberpunk_scifi', name: 'Futuristic Sci-Fi' }
  ]);
  const [selectedDesignStyle, setSelectedDesignStyle] = useState('cinematic_realistic');

  const [replicateConfigured, setReplicateConfigured] = useState(false);
  const [cloudflareConfigured, setCloudflareConfigured] = useState(false);
  const [groqConfigured, setGroqConfigured] = useState(false);
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [jobId, setJobId] = useState(null);

  const approvalBoardRef = useRef(null);
  const productionMonitorRef = useRef(null);

  useEffect(() => {
    // 1. Fetch current saved config
    fetch('/api/v1/custom/config')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.scenes) && data.scenes.length > 0) {
          const validScenes = data.scenes.filter(s => s && s.narration && !String(s.image_provider).includes('placeholder') && !String(s.image_path).includes('ai_scene_1_1795423323097'));
          if (validScenes.length > 0) {
            setConfig({ ...data, scenes: validScenes });
            if (data.voice) setSelectedVoice(data.voice);
            if (data.background_music) setSelectedMusic(data.background_music);
            if (data.design_style) setSelectedDesignStyle(data.design_style);
          }
        }
      })
      .catch(err => console.error('Error loading config:', err));

    // 2. Fetch voices
    fetch('/api/v1/voices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setVoices(data);
      })
      .catch(err => console.error('Error loading voices:', err));

    // 3. Fetch music tracks
    fetch('/api/v1/studio/music-tracks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setMusicTracks(data);
      })
      .catch(err => console.error('Error loading music tracks:', err));

    // 4. Fetch design styles
    fetch('/api/v1/studio/design-styles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setDesignStyles(data);
      })
      .catch(err => console.error('Error loading design styles:', err));

    // 5. Fetch Replicate status
    fetch('/api/v1/replicate/status')
      .then(res => res.json())
      .then(data => setReplicateConfigured(data.configured))
      .catch(err => console.error('Error loading Replicate status:', err));

    // 6. Fetch Cloudflare Workers AI status
    fetch('/api/v1/cloudflare/status')
      .then(res => res.json())
      .then(data => setCloudflareConfigured(data.configured))
      .catch(err => console.error('Error loading Cloudflare status:', err));

    // 7. Fetch Groq AI status
    fetch('/api/v1/groq/status')
      .then(res => res.json())
      .then(data => setGroqConfigured(data.configured))
      .catch(err => console.error('Error loading Groq status:', err));
  }, []);

  const handleVoiceSelect = (voiceId) => {
    setSelectedVoice(voiceId);
    setConfig(prev => ({ ...prev, voice: voiceId }));
  };

  const handleMusicSelect = (musicId) => {
    setSelectedMusic(musicId);
    setConfig(prev => ({ ...prev, background_music: musicId }));
  };

  const handleDesignStyleSelect = (styleId) => {
    setSelectedDesignStyle(styleId);
    setConfig(prev => ({ ...prev, design_style: styleId }));
  };

  const handleStoryboardGenerated = (generatedData) => {
    if (!generatedData) return;
    setConfig(prev => ({
      title: generatedData.title || 'Untitled Project',
      voice: generatedData.voice || selectedVoice,
      background_music: generatedData.background_music || selectedMusic,
      design_style: generatedData.design_style || selectedDesignStyle,
      target_duration: generatedData.target_duration || 60,
      estimated_total_duration: generatedData.estimated_total_duration || 60,
      subtitle_font: prev.subtitle_font || generatedData.subtitle_font || 'Arial',
      subtitle_style: prev.subtitle_style || generatedData.subtitle_style || 'clean_white',
      scenes: generatedData.scenes || []
    }));

    // Smooth scroll down to Approval Board
    setTimeout(() => {
      if (approvalBoardRef.current) {
        approvalBoardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
  };

  const handleApproveAndRender = async () => {
    if (!config.scenes || config.scenes.length === 0) {
      alert('Please generate storyboard scenes before starting production.');
      return;
    }

    setIsRendering(true);
    setJobId(null);

    try {
      const res = await fetch('/api/v1/custom/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Failed to start rendering job (${res.status})`);
      }

      const data = await res.json();
      setJobId(data.job_id);

      // Scroll to video monitor
      setTimeout(() => {
        if (productionMonitorRef.current) {
          productionMonitorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 200);
    } catch (err) {
      console.error('Error starting video production:', err);
      alert(`Could not start video generation: ${err.message}`);
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col font-sans antialiased">
      <Header
        replicateConfigured={replicateConfigured}
        cloudflareConfigured={cloudflareConfigured}
        groqConfigured={groqConfigured}
        onOpenReplicateModal={() => setIsReplicateModalOpen(true)}
        onOpenCloudflareModal={() => setIsCloudflareModalOpen(true)}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Step 1: Input Studio */}
        <StudioInputSection
          onStoryboardGenerated={handleStoryboardGenerated}
          voices={voices}
          selectedVoice={selectedVoice}
          onSelectVoice={handleVoiceSelect}
          musicTracks={musicTracks}
          selectedMusic={selectedMusic}
          onSelectMusic={handleMusicSelect}
          designStyles={designStyles}
          selectedDesignStyle={selectedDesignStyle}
          onSelectDesignStyle={handleDesignStyleSelect}
        />

        {/* 2-Column Section: Left = Approval Board, Right = Production Monitor / 1080p Player */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* Left Columns: Interactive Approval Board */}
          <section ref={approvalBoardRef} className="lg:col-span-7 xl:col-span-8">
            <ApprovalBoard
              config={config}
              onChangeConfig={setConfig}
              onApproveAndRender={handleApproveAndRender}
              isRendering={isRendering}
              musicTracks={musicTracks}
              voices={voices}
            />
          </section>

          {/* Right Columns: Sticky 1080p Video Player & Production Progress */}
          <section ref={productionMonitorRef} className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
            <ProductionMonitor
              config={config}
              externalJobId={jobId}
              onRenderingFinished={() => setIsRendering(false)}
            />
          </section>
        </div>
      </main>

      <CloudflareApiKeyModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        onConfigSaved={() => setCloudflareConfigured(true)}
      />

      <ReplicateApiKeyModal
        isOpen={isReplicateModalOpen}
        onClose={() => setIsReplicateModalOpen(false)}
        onConfigSaved={() => setReplicateConfigured(true)}
      />

      <footer className="border-t border-slate-300 bg-white px-4 sm:px-6 py-4 text-center text-xs font-medium text-slate-600 mt-6 sm:mt-8">
        VideoStudio Motion • 1080p Autonomous Multi-Scene Production
      </footer>
    </div>
  );
}

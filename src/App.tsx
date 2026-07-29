import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer, type YouTubePlayerHandle } from './components/YouTubePlayer';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import { FloatingDock } from './components/FloatingDock';
import { TopSearchOverlay } from './components/TopSearchOverlay';
import { ApiKeyModal } from './components/ApiKeyModal';
import { fetchVideoSubtitles, extractYouTubeId } from './services/transcriptService';
import { checkAppUpdates, applyInAppUpdate, type AppUpdateInfo } from './services/updateService';
import { RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { OnboardingModal } from './components/OnboardingModal';
import { useTranslation } from './i18n/TranslationContext';
import { useAppStore } from './store/useAppStore';
import { SendIntent } from 'capacitor-plugin-send-intent';

export function App() {
  const { t } = useTranslation();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  
  // Local UI States that don't need to be global
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Zustand Global State Selectors
  const videoId = useAppStore(s => s.videoId);
  const setVideoId = useAppStore(s => s.setVideoId);
  const cues = useAppStore(s => s.cues);
  const setCues = useAppStore(s => s.setCues);
  const setCurrentTime = useAppStore(s => s.setCurrentTime);
  const loadingSubtitles = useAppStore(s => s.loadingSubtitles);
  const setLoadingSubtitles = useAppStore(s => s.setLoadingSubtitles);
  const savedStartTime = useAppStore(s => s.savedStartTime);
  const setSavedStartTime = useAppStore(s => s.setSavedStartTime);
  const externalPause = useAppStore(s => s.externalPause);
  const playbackRate = useAppStore(s => s.playbackRate);
  const isSearchOpen = useAppStore(s => s.isSearchOpen);
  const setIsSearchOpen = useAppStore(s => s.setIsSearchOpen);
  const isSettingsOpen = useAppStore(s => s.isSettingsOpen);
  const setIsSettingsOpen = useAppStore(s => s.setIsSettingsOpen);
  const apiKey = useAppStore(s => s.apiKey);
  const setApiKey = useAppStore(s => s.setApiKey);
  const sourceLang = useAppStore(s => s.sourceLang);
  const setSourceLang = useAppStore(s => s.setSourceLang);
  const targetLang = useAppStore(s => s.targetLang);
  const setTargetLang = useAppStore(s => s.setTargetLang);
  const setShowSubtitleBg = useAppStore(s => s.setShowSubtitleBg);
  const setSyncOffset = useAppStore(s => s.setSyncOffset);
  const lookupWordAction = useAppStore(s => s.lookupWordAction);
  const setActiveWordTranslation = useAppStore(s => s.setActiveWordTranslation);

  // Check for Cloudflare App Live Updates on mount
  useEffect(() => {
    checkAppUpdates().then(setUpdateInfo).catch(() => {});
  }, []);

  // IndexedDB Migration and Initialization
  useEffect(() => {
    async function initStorage() {
      // Migrate localStorage to IDB if needed
      const oldKey = localStorage.getItem('yt_ceviri_gemini_key');
      if (oldKey !== null) {
        await set('yt_ceviri_gemini_key', oldKey);
        localStorage.removeItem('yt_ceviri_gemini_key');
      }
      const oldLastVideo = localStorage.getItem('yt_ceviri_last_video');
      if (oldLastVideo !== null) {
        await set('yt_ceviri_last_video', oldLastVideo);
        localStorage.removeItem('yt_ceviri_last_video');
      }
      const oldBg = localStorage.getItem('yt_ceviri_subtitle_bg');
      if (oldBg !== null) {
        await set('yt_ceviri_subtitle_bg', oldBg !== 'false');
        localStorage.removeItem('yt_ceviri_subtitle_bg');
      }
      const oldHistory = localStorage.getItem('yt_ceviri_watch_history');
      if (oldHistory !== null) {
        // Migration to new per-video history keys
        try {
          const hist = JSON.parse(oldHistory);
          for (const [vid, time] of Object.entries(hist)) {
             await set(`watch_history_${vid}`, time);
          }
        } catch (e) {}
        localStorage.removeItem('yt_ceviri_watch_history');
      }

      // Load from IDB
      try {
        const [savedVideoId, savedKey, savedSourceLang, savedTargetLang, savedOnboarding] = await Promise.all([
          get<string>('yt_ceviri_video_id'),
          get<string>('gemini_api_key'),
          get<string>('source_lang'),
          get<string>('target_lang'),
          get<boolean>('has_completed_onboarding')
        ]);
        if (savedVideoId) setVideoId(savedVideoId);
        if (savedKey) setApiKey(savedKey);
        if (savedSourceLang) setSourceLang(savedSourceLang);
        if (savedTargetLang) setTargetLang(savedTargetLang);
        const [savedBg, savedSync] = await Promise.all([
          get<boolean>('yt_ceviri_subtitle_bg'),
          get<number>('yt_ceviri_sync_offset')
        ]);
        if (savedBg !== undefined) setShowSubtitleBg(savedBg);
        if (savedSync !== undefined) setSyncOffset(savedSync);
        if (!savedOnboarding) setShowOnboarding(true);
      } catch (e) {
        console.error('Failed to load state from DB', e);
        setShowOnboarding(true);
      }
    }
    initStorage();
  }, []); // Run once on mount

  // Handle 100% In-App Instant Updating with CapacitorUpdater
  const handleApplyInAppUpdate = async () => {
    if (!updateInfo?.latestVersion || !updateInfo?.bundleUrl) return;
    setIsApplyingUpdate(true);
    setUpdateProgress(0);

    try {
      await applyInAppUpdate(
        updateInfo.latestVersion,
        updateInfo.bundleUrl,
        (percent) => setUpdateProgress(percent)
      );
      setTimeout(() => {
        setUpdateInfo(null);
        setIsApplyingUpdate(false);
        setUpdateSuccessMsg(`✨ ${t('updateSuccess')}`);
        setTimeout(() => setUpdateSuccessMsg(null), 4000);
      }, 500);
    } catch (err) {
      setIsApplyingUpdate(false);
      console.error('Update failed:', err);
      alert('Güncelleme sırasında bir hata oluştu.');
    }
  };

  // Load saved watch position whenever videoId changes (per-video key to prevent race conditions)
  useEffect(() => {
    async function loadSavedTime() {
      try {
        const time = await get(`watch_history_${videoId}`);
        setSavedStartTime(typeof time === 'number' ? time : 0);
      } catch (e) {
        console.warn('Failed to load saved time:', e);
      }
    }
    loadSavedTime();
  }, [videoId, setSavedStartTime]);

  // Handle Word & Idiom Lookup Events from SubtitleOverlay
  useEffect(() => {
    const handleWordLookup = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { word, isTargetWord, tokenId } = customEvent.detail;
      lookupWordAction(word, isTargetWord, tokenId);
    };

    const handleIdiomLookup = (e: Event) => {
      const customEvent = e as CustomEvent;
      const idiom = customEvent.detail;
      lookupWordAction(idiom, false, 'idiom-selection');
    };

    window.addEventListener('yt-ceviri-word-lookup', handleWordLookup);
    window.addEventListener('yt-ceviri-idiom-lookup', handleIdiomLookup);
    
    return () => {
      window.removeEventListener('yt-ceviri-word-lookup', handleWordLookup);
      window.removeEventListener('yt-ceviri-idiom-lookup', handleIdiomLookup);
    };
  }, [lookupWordAction]);

  const activeRequestRef = useRef<string>('');

  // Fetch subtitles whenever videoId or apiKey changes
  useEffect(() => {
    let isMounted = true;
    const currentRequest = `${videoId}_${sourceLang}_${targetLang}`;
    activeRequestRef.current = currentRequest;
    
    setCues([]);
    setLoadingSubtitles(true);

    async function loadSubs() {
      try {
        const result = await fetchVideoSubtitles(videoId, sourceLang, targetLang, apiKey, (fastCues) => {
          if (isMounted && activeRequestRef.current === currentRequest) {
            setCues(fastCues);
            setLoadingSubtitles(false);
          }
        });
        if (isMounted && activeRequestRef.current === currentRequest && result.cues.length > 0) {
          setCues(result.cues);
        }
      } catch (err) {
        console.error('Subtitles load error:', err);
      } finally {
        if (isMounted && activeRequestRef.current === currentRequest) setLoadingSubtitles(false);
      }
    }
    loadSubs();

    return () => { isMounted = false; };
  }, [videoId, apiKey, sourceLang, targetLang, setCues, setLoadingSubtitles]);

  // Handle Loading a new Video URL or ID
  const handleLoadVideo = (urlOrId: string) => {
    const extracted = extractYouTubeId(urlOrId);
    if (extracted !== videoId) {
      setCues([]);
      setVideoId(extracted);
      setActiveWordTranslation(null);
    }
  };

  // Check for shared links (SendIntent) from Android
  useEffect(() => {
    const checkIntent = async () => {
      try {
        const result: any = await (SendIntent as any).checkSendIntentReceived();
        if (result && (result.url || result.value || result.title)) {
          const text = result.url || result.value || result.title;
          if (text) handleLoadVideo(text);
        }
      } catch (e) {
        console.warn('SendIntent check failed', e);
      }
    };
    
    // Check when component mounts
    checkIntent();
    
    // Listen for new intents while app is open
    window.addEventListener('sendIntentReceived', checkIntent);
    return () => {
      window.removeEventListener('sendIntentReceived', checkIntent);
    };
  }, []);

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    set('yt_ceviri_gemini_key', key);
  };

  return (
    <div className="h-screen w-screen overflow-hidden mesh-bg text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white relative">
      {showOnboarding && (
        <OnboardingModal 
          onComplete={() => {
            setShowOnboarding(false);
            set('has_completed_onboarding', true);
          }} 
        />
      )}
      <TopSearchOverlay 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onLoadVideo={handleLoadVideo}
      />

      {isApplyingUpdate && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <h3 className="text-lg font-bold text-white">{t('loadingUpdate')}</h3>
          <p className="text-xs text-slate-400">{t('pleaseWait')}</p>
          <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden border border-white/10 relative">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{ width: `${updateProgress}%` }}
            />
          </div>
          <p className="text-xs font-bold text-emerald-400">% {updateProgress}</p>
        </div>
      )}

      {updateSuccessMsg && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{updateSuccessMsg}</h3>
            </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center space-y-6">
        <div className="w-full relative max-w-5xl aspect-video group rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <YouTubePlayer
            ref={playerRef}
            videoId={videoId}
            initialStartTime={savedStartTime}
            onTimeUpdate={(t) => setCurrentTime(t)}
            onStateChange={() => {}}
            externalPauseRequest={externalPause}
            playbackRate={playbackRate}
          >
            {loadingSubtitles && cues.length === 0 ? (
              <div className="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl animate-pulse">
                <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                <span className="text-xs font-semibold text-slate-300">
                  {t('loading')}
                </span>
              </div>
            ) : cues.length === 0 ? (
              <div className="pointer-events-auto flex flex-col items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                <p className="text-slate-300 text-sm font-semibold mb-3">{t('noSubtitles')}</p>
              </div>
            ) : (
              <SubtitleOverlay />
            )}
          </YouTubePlayer>
        </div>
      </main>

      {updateInfo?.hasUpdate && !isApplyingUpdate && (
        <div className="fixed bottom-24 right-6 z-50 bg-emerald-950/95 border border-emerald-500/50 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-3 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-300">{t('newUpdateAvailable')}</h4>
            <p className="text-[11px] text-emerald-200/80">v{updateInfo.latestVersion}</p>
          </div>
          <button
            type="button"
            onClick={handleApplyInAppUpdate}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all shrink-0 cursor-pointer"
          >
            {t('applyUpdate')}
          </button>
        </div>
      )}

      <FloatingDock 
        onSearchToggle={() => setIsSearchOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        updateInfo={updateInfo}
        onApplyUpdate={handleApplyInAppUpdate}
      />

      <ApiKeyModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentKey={apiKey}
        onSave={handleSaveApiKey}
        onCheckUpdates={async () => {
          const res = await checkAppUpdates();
          if (!res.hasUpdate) {
            alert('Uygulamanız güncel.');
          }
          setUpdateInfo(res);
        }}
      />
    </div>
  );
}

export default App;

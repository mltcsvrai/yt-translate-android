import { useState, useEffect, useRef } from 'react';
import { YouTubePlayer, type YouTubePlayerHandle } from './components/YouTubePlayer';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import { FloatingDock } from './components/FloatingDock';
import { TopSearchOverlay } from './components/TopSearchOverlay';
import { ApiKeyModal } from './components/ApiKeyModal';
import type { SubtitleCue, SubtitleMode, WordTranslation } from './types';
import { fetchVideoSubtitles, extractYouTubeId } from './services/transcriptService';
import { lookupWord } from './services/dictionaryService';
import { checkAppUpdates, applyInAppUpdate, type AppUpdateInfo } from './services/updateService';
import { RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { OnboardingModal } from './components/OnboardingModal';
import { useTranslation } from './i18n/TranslationContext';

export function App() {
  const { t } = useTranslation();
  const playerRef = useRef<YouTubePlayerHandle>(null);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Read last watched videoId from localStorage if available
  const [videoId, setVideoId] = useState<string>('0VBIICYDjPo');

  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loadingSubtitles, setLoadingSubtitles] = useState<boolean>(false);
  const [savedStartTime, setSavedStartTime] = useState<number>(0);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Settings state
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>('DUAL');
  const [fontSize, setFontSize] = useState<number>(25); // 25px default
  const [activeWordTranslation, setActiveWordTranslation] = useState<WordTranslation | null>(null);
  const [wordLoading, setWordLoading] = useState<boolean>(false);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [externalPause, setExternalPause] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [autoPause, setAutoPause] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  
  // Language States
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [targetLang, setTargetLang] = useState<string>('tr');
  const [showSubtitleBg, setShowSubtitleBg] = useState<boolean>(true);
  const [syncOffset, setSyncOffset] = useState<number>(1.5);

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
      const oldHistory = localStorage.getItem('yt_ceviri_watch_history');
      if (oldHistory !== null) {
        try {
          await set('yt_ceviri_watch_history', JSON.parse(oldHistory));
        } catch (e) {}
        localStorage.removeItem('yt_ceviri_watch_history');
      }
      const oldBg = localStorage.getItem('yt_ceviri_subtitle_bg');
      if (oldBg !== null) {
        await set('yt_ceviri_subtitle_bg', oldBg !== 'false');
        localStorage.removeItem('yt_ceviri_subtitle_bg');
      }

      // Load from IDB
      const loadState = async () => {
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
    };
    loadState();
    }
    initStorage();
  }, []);

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
      // Wait a tiny bit before we show success (though the app will restart naturally)
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

  // Load saved watch position whenever videoId changes
  useEffect(() => {
    async function loadSavedTime() {
      try {
        const history = await get('yt_ceviri_watch_history') || {};
        if (history[videoId] && typeof history[videoId] === 'number') {
          setSavedStartTime(history[videoId]);
        } else {
          setSavedStartTime(0);
        }
      } catch (e) {
        console.warn('Failed to load saved time:', e);
      }
    }
    loadSavedTime();
  }, [videoId]);

  const lastSaveTimeRef = useRef(0);

  // Save current watch progress to IDB (Throttled)
  useEffect(() => {
    if (currentTime > 2 && videoId) {
      const now = Date.now();
      // Only save to IDB every 5 seconds to avoid heavy I/O
      if (now - lastSaveTimeRef.current > 5000) {
        lastSaveTimeRef.current = now;
        get('yt_ceviri_watch_history').then((history: any) => {
          const h = history || {};
          h[videoId] = Math.floor(currentTime);
          return set('yt_ceviri_watch_history', h);
        }).catch(e => console.warn('IDB save error:', e));
        
        set('yt_ceviri_last_video', videoId).catch(() => {});
      }
    }
  }, [currentTime, videoId]);

  const activeRequestRef = useRef<string>('');

  // Fetch subtitles whenever videoId or apiKey changes
  useEffect(() => {
    let isMounted = true;
    const currentRequest = `${videoId}_${sourceLang}_${targetLang}`;
    activeRequestRef.current = currentRequest;
    
    // BUG FIX: Clear existing cues when videoId changes to prevent overlap
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
  }, [videoId, apiKey, sourceLang, targetLang]);

  // Compute active cue for current playback time
  const adjustedTime = currentTime + syncOffset;
  const currentCue = cues.find(c => adjustedTime >= c.start && adjustedTime <= c.end) || null;

  // Handle Loading a new Video URL or ID
  const handleLoadVideo = (urlOrId: string) => {
    const extracted = extractYouTubeId(urlOrId);
    if (extracted !== videoId) {
      setCues([]); // Ensure old subtitles don't stick on screen
      setVideoId(extracted);
      setActiveWordTranslation(null);
    }
  };

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    set('yt_ceviri_gemini_key', key);
  };

  const handleLanguageChange = (type: 'source' | 'target', val: string) => {
    if (type === 'source') {
      setSourceLang(val);
      set('yt_ceviri_source_lang', val);
    } else {
      setTargetLang(val);
      set('yt_ceviri_target_lang', val);
    }
  };

  const lookupRef = useRef<number>(0);

  // Handle Word Click event from subtitle
  const handleWordClick = async (word: string, isTurkish: boolean = false, tokenId: string) => {
    setActiveTokenId(tokenId);

    if (autoPause) {
      setExternalPause(true);
      setTimeout(() => setExternalPause(false), 300);
    }

    setWordLoading(true);
    const currentLookup = ++lookupRef.current;
    
    try {
      const translation = await lookupWord(word, sourceLang, targetLang, isTurkish, apiKey);
      if (currentLookup === lookupRef.current) {
        setActiveWordTranslation(translation);
      }
    } catch (err) {
      console.warn('Word translation error:', err);
      if (currentLookup === lookupRef.current) {
        setActiveWordTranslation({
          word,
          normalizedWord: word,
          translation: 'Bulunamadı'
        });
      }
    } finally {
      if (currentLookup === lookupRef.current) {
        setWordLoading(false);
      }
    }
  };

  const handleToggleSubtitleBg = () => {
    const newVal = !showSubtitleBg;
    setShowSubtitleBg(newVal);
    set('yt_ceviri_subtitle_bg', newVal);
  };

  const handleSyncOffsetChange = (val: number) => {
    setSyncOffset(val);
    set('yt_ceviri_sync_offset', val);
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

      {/* In-App Live Updating Overlay Progress */}
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

      {/* Success Toast Notification */}
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

      {/* Main Content Area (Samsung Tab S9+ Optimized) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center space-y-6">
        {/* Video Player Container with Video Subtitle Overlay */}
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
                <SubtitleOverlay
                  currentCue={currentCue}
                  mode={subtitleMode}
                  fontSize={fontSize}
                  onWordClick={handleWordClick}
                activeTokenId={activeTokenId}
                activeWordTranslation={activeWordTranslation}
                wordLoading={wordLoading}
                onCloseTooltip={() => {
                  setActiveTokenId(null);
                  setActiveWordTranslation(null);
                }}
                showSubtitleBg={showSubtitleBg}
              />
            )}
          </YouTubePlayer>
        </div>
      </main>

      {/* Bottom-Right Floating Update Available Toast Notification */}
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


      {/* Modern Floating Dock (Replaces Header & ControlBar) */}
      <FloatingDock 
        onSearchToggle={() => setIsSearchOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        updateInfo={updateInfo}
        onApplyUpdate={handleApplyInAppUpdate}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        autoPause={autoPause}
        onAutoPauseChange={setAutoPause}
        subtitleMode={subtitleMode}
        onModeChange={setSubtitleMode}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onLanguageChange={handleLanguageChange}
        showSubtitleBg={showSubtitleBg}
        onToggleSubtitleBg={handleToggleSubtitleBg}
        syncOffset={syncOffset}
        onSyncOffsetChange={handleSyncOffsetChange}
      />

      {/* Settings & Gemini API Modal */}
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

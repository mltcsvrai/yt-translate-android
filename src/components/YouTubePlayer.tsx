import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Maximize, Minimize, History } from 'lucide-react';

export interface YouTubePlayerHandle {
  toggleFullscreen: () => void;
  seekTo: (seconds: number) => void;
}

interface YouTubePlayerProps {
  videoId: string;
  initialStartTime?: number;
  onTimeUpdate: (currentTime: number) => void;
  onStateChange: (isPlaying: boolean) => void;
  externalPauseRequest?: boolean;
  playbackRate?: number;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({
  videoId,
  initialStartTime,
  onTimeUpdate,
  onStateChange,
  externalPauseRequest,
  playbackRate = 1,
  onFullscreenToggle,
  children
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const idleTimerRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [resumedToast, setResumedToast] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    toggleFullscreen: () => {
      toggleFullscreen();
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }
  }));

  const handleUserInteraction = () => {
    setIsControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 2800);
  };

  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(playbackRate);
    }
  }, [playbackRate]);

  useEffect(() => {
    const handleFsChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (onFullscreenToggle) onFullscreenToggle(active);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [onFullscreenToggle]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const initPlayer = () => {
    if (!containerRef.current) return;
    
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        cc_load_policy: 0,
        iv_load_policy: 3, // Disable video annotations
        fs: 0, // Disable native iframe-only fullscreen
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);
          
          // Auto-resume from saved watch progress
          if (initialStartTime) {
            event.target.seekTo(initialStartTime, true);
            setResumedToast(`Kaldığınız yerden devam ediyor: ${Math.floor(initialStartTime/60)}:${Math.floor(initialStartTime%60).toString().padStart(2,'0')}`);
            setTimeout(() => setResumedToast(null), 4000);
          }
          // Initialize playback rate
          event.target.setPlaybackRate(playbackRate);
          
          event.target.playVideo();
          startTimer();
          handleUserInteraction();
        },
        onStateChange: (event: any) => {
          const playing = event.data === 1;
          onStateChange(playing);
          if (playing) {
            startTimer();
          } else {
            stopTimer();
          }
        }
      }
    });
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        onTimeUpdate(time);
      }
    }, 200);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (externalPauseRequest && playerRef.current && playerRef.current.pauseVideo) {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        console.warn('Player pause failed:', err);
      }
    }
  }, [externalPauseRequest]);

  const toggleFullscreen = () => {
    if (!playerWrapperRef.current) return;

    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <div
      ref={playerWrapperRef}
      onMouseMove={handleUserInteraction}
      onMouseEnter={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onMouseLeave={() => setIsControlsVisible(false)}
      className={`absolute inset-0 z-10 w-full h-full bg-black group ${
        isFullscreen ? 'z-50' : ''
      }`}
    >
      {/* Embedded Video IFrame */}
      <div ref={containerRef} className="w-full h-full pointer-events-auto" />

      {/* Loading Spinner */}
      {!isReady && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-30">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-300">YouTube Oynatıcı Yükleniyor...</span>
        </div>
      )}

      {/* Resume Watch Toast Banner */}
      {resumedToast && (
        <div className="absolute top-4 left-4 z-40 bg-slate-900/90 border border-red-500/40 text-red-300 px-3.5 py-2 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center space-x-2 animate-bounce text-xs font-semibold">
          <History className="w-4 h-4 text-red-400" />
          <span>{resumedToast}</span>
        </div>
      )}

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className={`absolute z-40 bg-slate-950/85 hover:bg-red-600 backdrop-blur-xl text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-2xl flex items-center space-x-1.5 text-xs font-semibold transition-all duration-300 ${
          isControlsVisible
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-2'
        } ${
          isFullscreen ? 'bottom-16 right-4' : 'bottom-14 right-4'
        }`}
        title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Yap (Altyazılar Dahil)'}
      >
        {isFullscreen ? (
          <>
            <Minimize className="w-3.5 h-3.5 text-red-400" />
            <span>Küçült</span>
          </>
        ) : (
          <>
            <Maximize className="w-3.5 h-3.5 text-white" />
            <span>Tam Ekran</span>
          </>
        )}
      </button>

      {/* Dynamic Subtitles Overlay Layer */}
      <div className={`absolute left-0 right-0 z-30 pointer-events-none flex justify-center px-4 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
        isControlsVisible
          ? 'bottom-32 sm:bottom-40' // Move up more when dock/controls are visible
          : 'bottom-8 sm:bottom-12'
      }`}>
        {children}
      </div>
    </div>
  );
});

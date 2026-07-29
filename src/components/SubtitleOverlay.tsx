import React, { useRef, useMemo } from 'react';
import { WordToken } from './WordToken';
import { useAppStore } from '../store/useAppStore';

export const SubtitleOverlay: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Subscribe to required states from Zustand
  const cues = useAppStore(s => s.cues);
  const currentTime = useAppStore(s => s.currentTime);
  const syncOffset = useAppStore(s => s.syncOffset);
  const mode = useAppStore(s => s.subtitleMode);
  const fontSize = useAppStore(s => s.fontSize);
  const showSubtitleBg = useAppStore(s => s.showSubtitleBg);

  // O(1) Amortized Linear Search for active cue (Handles overlaps perfectly)
  const lastIndexRef = useRef(0);
  const currentCue = useMemo(() => {
    if (cues.length === 0) return null;
    const adjustedTime = currentTime + syncOffset;
    
    let bestIndex = -1;
    // Fast path: Check around last known index first
    const startIdx = Math.max(0, lastIndexRef.current - 5);
    const endIdx = Math.min(cues.length - 1, lastIndexRef.current + 5);
    
    for (let i = startIdx; i <= endIdx; i++) {
      if (adjustedTime >= cues[i].start && adjustedTime <= cues[i].end) {
        bestIndex = i;
        break;
      }
    }

    // Fallback: Full linear scan if jumped far
    if (bestIndex === -1) {
      for (let i = 0; i < cues.length; i++) {
        if (adjustedTime >= cues[i].start && adjustedTime <= cues[i].end) {
          bestIndex = i;
          break;
        }
      }
    }

    if (bestIndex !== -1) {
      lastIndexRef.current = bestIndex;
      return cues[bestIndex];
    }
    
    return null;
  }, [cues, currentTime, syncOffset]);

  if (!currentCue) {
    return null;
  }

  // Idiom (Multi-word) selection handling
  const handlePointerUp = () => {
    const selection = window.getSelection();
    if (selection) {
      const text = selection.toString().trim();
      if (text.includes(' ')) {
        // Multi-word selected! Trigger lookup logic directly using window event or global function.
        // We will dispatch a custom event that App.tsx can listen to, or we can just call window.lookupIdiom
        // For clean architecture, we'll dispatch a custom DOM event.
        const event = new CustomEvent('yt-ceviri-idiom-lookup', { detail: text });
        window.dispatchEvent(event);
      }
    }
  };

  const renderInteractiveText = (text: string, isTargetWord: boolean) => {
    const tokens = text.split(/(\s+)/);
    const prefix = isTargetWord ? 'tgt' : 'src';
    return tokens.map((token, idx) => {
      if (token.trim().length === 0) {
        return <span key={idx}>{token}</span>;
      }
      const tokenId = `${prefix}-${idx}`;
      return (
        <WordToken
          key={idx}
          token={token}
          isTargetWord={isTargetWord}
          tokenId={tokenId}
        />
      );
    });
  };

  const showSource = mode === 'SOURCE' || mode === 'DUAL';
  const showTarget = mode === 'TARGET' || mode === 'DUAL';

  return (
    <div
      ref={containerRef}
      onPointerUp={handlePointerUp}
      className="w-full flex flex-col items-center justify-center transition-all duration-300 pointer-events-none"
    >
      <div className={`w-full flex flex-col items-center justify-center space-y-1.5 pointer-events-auto max-w-[90%] sm:max-w-4xl mx-auto text-center px-4 py-2 rounded-xl transition-colors duration-300 ${
        showSubtitleBg ? 'bg-black/60 backdrop-blur-sm' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
      }`}>

        {showSource && currentCue.sourceText && (
          <div
            className="font-sans font-bold text-white tracking-wide leading-tight selection:bg-red-500 selection:text-white cursor-text"
            style={{ fontSize: `${fontSize}px` }}
          >
            {renderInteractiveText(currentCue.sourceText, false)}
          </div>
        )}

        {showTarget && currentCue.targetText && (
          <div
            className={`font-sans font-extrabold tracking-wide leading-tight cursor-text ${showSource ? 'text-yellow-400' : 'text-white'}`}
            style={{ fontSize: `${Math.max(16, fontSize - (showSource ? 4 : 0))}px` }}
          >
            {renderInteractiveText(currentCue.targetText, true)}
          </div>
        )}
      </div>
    </div>
  );
});

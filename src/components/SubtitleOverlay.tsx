import React, { useRef } from 'react';
import type { SubtitleCue, SubtitleMode, WordTranslation } from '../types';
import { WordTooltip } from './WordTooltip';

interface SubtitleOverlayProps {
  currentCue: SubtitleCue | null;
  mode: SubtitleMode;
  fontSize: number;
  onWordClick: (word: string, isTargetWord: boolean, tokenId: string) => void;
  activeTokenId: string | null;
  activeWordTranslation: WordTranslation | null;
  wordLoading: boolean;
  onCloseTooltip: () => void;
  showSubtitleBg?: boolean;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  currentCue,
  mode,
  fontSize,
  onWordClick,
  activeTokenId,
  activeWordTranslation,
  wordLoading,
  onCloseTooltip,
  showSubtitleBg = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!currentCue) {
    return null;
  }

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string, isTargetWord: boolean, tokenId: string) => {
    e.stopPropagation();
    const cleanWord = word.replace(/[.,!?()[\]{}"':;]/g, "");
    if (cleanWord.trim()) {
      onWordClick(cleanWord, isTargetWord, tokenId);
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
      const isActive = activeTokenId === tokenId;
      return (
        <span
          key={idx}
          className="relative inline-block px-[2px] transition-all duration-200 pointer-events-auto"
        >
          <span 
            onClick={(e) => handleWordClick(e, token, isTargetWord, tokenId)}
            className="inline-block cursor-pointer hover:text-yellow-300 hover:scale-[1.15] active:scale-95 transition-transform drop-shadow-md"
          >
            {token}
          </span>
          {isActive && (
            <WordTooltip
              translation={activeWordTranslation}
              loading={wordLoading}
              onClose={onCloseTooltip}
            />
          )}
        </span>
      );
    });
  };

  const showSource = mode === 'SOURCE' || mode === 'DUAL';
  const showTarget = mode === 'TARGET' || mode === 'DUAL';

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center justify-center transition-all duration-300 pointer-events-none"
    >
      <div className={`w-full flex flex-col items-center justify-center space-y-1.5 pointer-events-none max-w-[90%] sm:max-w-4xl mx-auto text-center px-4 py-2 rounded-xl transition-colors duration-300 ${
        showSubtitleBg ? 'bg-black/60 backdrop-blur-sm' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
      }`}>

        {showSource && currentCue.sourceText && (
          <div
            className="font-sans font-bold text-white tracking-wide leading-tight selection:bg-red-500 selection:text-white"
            style={{ fontSize: `${fontSize}px` }}
          >
            {renderInteractiveText(currentCue.sourceText, false)}
          </div>
        )}

        {showTarget && currentCue.targetText && (
          <div
            className={`font-sans font-extrabold tracking-wide leading-tight ${showSource ? 'text-yellow-400' : 'text-white'}`}
            style={{ fontSize: `${Math.max(16, fontSize - (showSource ? 4 : 0))}px` }}
          >
            {renderInteractiveText(currentCue.targetText, true)}
          </div>
        )}
      </div>
    </div>
  );
};

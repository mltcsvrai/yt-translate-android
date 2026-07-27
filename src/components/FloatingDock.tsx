import React, { useState } from 'react';
import { Search, Settings, Type, Pause, Play, DownloadCloud, MonitorPlay } from 'lucide-react';
import type { AppUpdateInfo } from '../services/updateService';
import type { SubtitleMode } from '../types';
import { useTranslation } from '../i18n/TranslationContext';

interface FloatingDockProps {
  onSearchToggle: () => void;
  onSettingsOpen: () => void;
  updateInfo: AppUpdateInfo | null;
  onApplyUpdate: () => void;
  // Subtitle Settings
  fontSize: number;
  onFontSizeChange: (val: number) => void;
  subtitleMode: SubtitleMode;
  onModeChange: (val: SubtitleMode) => void;
  sourceLang: string;
  targetLang: string;
  onLanguageChange: (type: 'source' | 'target', val: string) => void;
  // Video Settings
  autoPause: boolean;
  onAutoPauseChange: (val: boolean) => void;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  showSubtitleBg: boolean;
  onToggleSubtitleBg: () => void;
  syncOffset: number;
  onSyncOffsetChange: (val: number) => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  onSearchToggle,
  onSettingsOpen,
  updateInfo,
  onApplyUpdate,
  fontSize,
  onFontSizeChange,
  subtitleMode,
  onModeChange,
  sourceLang,
  targetLang,
  onLanguageChange,
  autoPause,
  onAutoPauseChange,
  playbackRate,
  onPlaybackRateChange,
  showSubtitleBg,
  onToggleSubtitleBg,
  syncOffset,
  onSyncOffsetChange
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'subtitle' | 'video' | null>(null);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none transition-all duration-300">
      
      {/* Settings Popover */}
      {activeTab === 'subtitle' && (
        <div className="mb-4 w-72 bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex flex-col space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block px-1 uppercase tracking-wider">{t('sourceLang')}</label>
              <select
                value={sourceLang}
                onChange={(e) => onLanguageChange('source', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all appearance-none"
              >
                <option value="auto">{t('autoDetect')}</option>
                <option value="en">{t('english')}</option>
                <option value="de">{t('german')}</option>
                <option value="tr">{t('turkish')}</option>
                <option value="es">{t('spanish')}</option>
                <option value="fr">{t('french')}</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block px-1 uppercase tracking-wider">{t('targetLang')}</label>
              <select
                value={targetLang}
                onChange={(e) => onLanguageChange('target', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all appearance-none"
              >
                <option value="tr">{t('turkish')}</option>
                <option value="de">{t('german')}</option>
                <option value="en">{t('english')}</option>
                <option value="es">{t('spanish')}</option>
                <option value="fr">{t('french')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm font-semibold text-slate-300">{t('viewMode')}</span>
              <button
                onClick={() => onModeChange(subtitleMode === 'SOURCE' ? 'TARGET' : subtitleMode === 'TARGET' ? 'DUAL' : 'SOURCE')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  subtitleMode === 'DUAL' 
                    ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'bg-white/10 text-white'
                }`}
              >
                {subtitleMode === 'DUAL' ? t('dualLanguage') : subtitleMode === 'TARGET' ? t('targetOnly') : t('sourceOnly')}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>{t('subtitleSize')}</span>
                <span className="bg-black/30 px-2 py-0.5 rounded-md">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-500"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm font-semibold text-slate-300">{t('background')}</span>
              <button
                onClick={() => onToggleSubtitleBg()}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  showSubtitleBg ? 'bg-red-500' : 'bg-slate-700'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    showSubtitleBg ? 'left-6' : 'left-1'
                  }`} 
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'video' && (
        <div className="mb-4 w-64 bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
          <div className="flex flex-col space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">{t('autoPause')}</span>
              <button
                onClick={() => onAutoPauseChange(!autoPause)}
                className={`p-2.5 rounded-full transition-all ${
                  autoPause ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-white/10 text-slate-300'
                }`}
              >
                {autoPause ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>{t('playbackSpeed')}</span>
                <span className="bg-black/30 px-2 py-0.5 rounded-md">{playbackRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={playbackRate}
                onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>{t('subtitleSync') || 'Timing'}</span>
                <span className="bg-black/30 px-2 py-0.5 rounded-md">{syncOffset > 0 ? '+' : ''}{syncOffset}s</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={syncOffset}
                onChange={(e) => onSyncOffsetChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Dock */}
      <div className="flex items-center justify-center space-x-1.5 bg-black/60 backdrop-blur-3xl border border-white/10 p-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] ring-1 ring-white/5 pointer-events-auto">
        
        <DockIcon 
          icon={<Search size={22} strokeWidth={2.5} />} 
          label={t('searchVideoPlaceholder').split(' ')[0]} 
          onClick={() => { setActiveTab(null); onSearchToggle(); }} 
        />
        
        <div className="w-px h-8 bg-white/10 mx-1" />

        <DockIcon 
          icon={<Type size={22} strokeWidth={2.5} />} 
          label="CC" 
          onClick={() => setActiveTab(activeTab === 'subtitle' ? null : 'subtitle')} 
          active={activeTab === 'subtitle'}
        />

        <DockIcon 
          icon={<MonitorPlay size={22} strokeWidth={2.5} />} 
          label="Video" 
          onClick={() => setActiveTab(activeTab === 'video' ? null : 'video')} 
          active={activeTab === 'video'}
        />

        <div className="w-px h-8 bg-white/10 mx-1" />

        <DockIcon 
          icon={<Settings size={22} strokeWidth={2.5} />} 
          label={t('settings')} 
          onClick={() => { setActiveTab(null); onSettingsOpen(); }} 
        />

        {updateInfo?.hasUpdate && (
          <>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <button 
              onClick={onApplyUpdate}
              className="group relative p-3 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all"
            >
              <DownloadCloud size={22} strokeWidth={2.5} className="animate-pulse" />
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-bold py-1 px-3 rounded-xl whitespace-nowrap shadow-xl border border-white/10 pointer-events-none">
                Update (v{updateInfo.latestVersion})
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

function DockIcon({ 
  icon, 
  label, 
  onClick, 
  active = false,
  highlight = false,
  color = "text-slate-200"
}: { 
  icon: React.ReactNode, 
  label: string, 
  onClick: () => void,
  active?: boolean,
  highlight?: boolean,
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative p-3.5 rounded-full transition-all duration-300 ease-out active:scale-90
        ${active ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'} 
        ${highlight ? 'animate-pulse ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : ''}
      `}
    >
      <span className={`${color} transition-colors ${active ? 'text-white' : ''}`}>{icon}</span>
      <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3.5 rounded-xl whitespace-nowrap shadow-xl border border-white/10 pointer-events-none">
        {label}
      </div>
    </button>
  );
}

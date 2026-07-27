import React, { useState } from 'react';
import { Search, X, Video } from 'lucide-react';
import { useTranslation } from '../i18n/TranslationContext';

interface TopSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadVideo: (url: string) => void;
}

export const TopSearchOverlay: React.FC<TopSearchOverlayProps> = ({
  isOpen,
  onClose,
  onLoadVideo
}) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onLoadVideo(url.trim());
      setUrl('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-in slide-in-from-top-10 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full">
              <Video size={28} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{t('openNewVideo')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-90"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            placeholder={t('videoLinkOrId')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-32 text-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white/10 transition-all"
            autoFocus
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors" size={24} />
          <button 
            type="submit"
            disabled={!url.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            {t('open')}
          </button>
        </form>
      </div>
    </div>
  );
};

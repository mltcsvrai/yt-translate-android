import React, { useState } from 'react';
import { Key, X, Eye, EyeOff, Sparkles, RefreshCcw } from 'lucide-react';
import { DISPLAY_VERSION } from '../services/updateService';
import { useTranslation } from '../i18n/TranslationContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
  onCheckUpdates: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey, onCheckUpdates }) => {
  const { t } = useTranslation();
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(key.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3 text-red-500">
            <div className="p-2 bg-red-500/10 rounded-full">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{t('appSettings')}</h2>
              <p className="text-xs text-slate-400">{t('appSettingsDesc')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-90">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">{t('versionControl')}</h3>
              <p className="text-xs text-slate-400">{t('installedVersion')}: v{DISPLAY_VERSION}</p>
            </div>
            <button
              onClick={onCheckUpdates}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all"
            >
              <RefreshCcw size={14} />
              <span>{t('checkForUpdates')}</span>
            </button>
          </div>

          {/* Languages moved to FloatingDock */}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
              <Key size={14} /> {t('geminiApiWhatIsIt')}
            </h3>
            <p className="text-xs text-blue-200/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('geminiApiExplText') }} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-slate-300">Google Gemini API Key:</label>
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
              >
                {showKey ? <><EyeOff size={14}/><span>{t('hide')}</span></> : <><Eye size={14}/><span>{t('show')}</span></>}
              </button>
            </div>
            <input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AQ..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-black/60 transition-all"
            />
            <p className="text-[10px] text-slate-500 px-1 mt-1">
              {t('getFreeFromGoogle')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            {t('giveUp')}
          </button>
          <button 
            onClick={handleSave}
            className="bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

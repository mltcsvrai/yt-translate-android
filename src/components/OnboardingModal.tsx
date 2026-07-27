import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import type { Language } from '../i18n/translations';
import { get, set } from 'idb-keyval';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { t, language, setLanguage } = useTranslation();
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await get('has_completed_onboarding');
      if (!hasLaunched) {
        setIsVisible(true);
      } else {
        onComplete();
      }
    };
    checkFirstLaunch();
  }, [onComplete]);

  if (!isVisible) return null;

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await set('has_completed_onboarding', true);
    setIsVisible(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
      <div className="w-full max-w-sm bg-slate-900/90 border border-white/20 rounded-[2rem] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {step === 0 && (
          <div className="flex flex-col items-center space-y-6 animate-in slide-in-from-right-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">{t('welcome')}</h2>
              <p className="text-sm text-slate-400">{t('welcomeDesc')}</p>
            </div>

            <div className="w-full space-y-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all appearance-none"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center space-y-6 animate-in slide-in-from-right-4">
            <div className="w-full h-32 bg-black/40 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-purple-500/20 mix-blend-overlay"></div>
               <svg className="w-12 h-12 text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">{t('tutorialStep1Title')}</h2>
              <p className="text-sm text-slate-400">{t('tutorialStep1Desc')}</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center space-y-6 animate-in slide-in-from-right-4">
            <div className="w-full h-32 bg-black/40 rounded-xl border border-white/10 flex flex-col items-center justify-center relative p-4 space-y-2">
               <span className="text-white/60 line-through text-xs">{t('literalTranslation')}</span>
               <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full cursor-pointer hover:bg-white/20 transition text-sm flex items-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                 {t('contextAware')}
                 <svg className="w-3 h-3 text-red-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 110 2 1 1 0 010-2z" /></svg>
               </span>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white">{t('tutorialStep2Title')}</h2>
              <p className="text-sm text-slate-400">{t('tutorialStep2Desc')}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-6 bg-red-500' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            className="bg-white text-black px-6 py-2 rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {step === 2 ? t('start') : t('next')}
          </button>
        </div>

      </div>
    </div>
  );
};

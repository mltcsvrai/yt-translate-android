import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Language, type TranslationKey } from './translations';
import { get, set } from 'idb-keyval';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await get('app_language');
        if (storedLang && ['tr', 'en', 'de', 'es', 'fr'].includes(storedLang)) {
          setLanguageState(storedLang as Language);
        } else {
          // Detect browser language as fallback
          const browserLang = navigator.language.split('-')[0];
          if (['tr', 'en', 'de', 'es', 'fr'].includes(browserLang)) {
            setLanguageState(browserLang as Language);
          } else {
            setLanguageState('en');
          }
        }
      } catch (err) {
        console.error('Error loading language', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await set('app_language', lang);
    } catch (err) {
      console.error('Error saving language', err);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  if (!isLoaded) return null; // Avoid render flash

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

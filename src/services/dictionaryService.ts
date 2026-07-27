import { CapacitorHttp } from '@capacitor/core';
import type { WordTranslation } from '../types';

async function smartFetch(url: string, options?: { method?: string; headers?: any; body?: string }): Promise<{ ok: boolean; json: () => Promise<any> }> {
  try {
    const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
    if (isNative) {
      const response = await CapacitorHttp.request({
        url,
        method: options?.method || 'GET',
        headers: options?.headers || { 'User-Agent': 'Mozilla/5.0' },
        data: options?.body ? JSON.parse(options.body) : undefined
      });
      const rawData = response.data;
      return {
        ok: response.status >= 200 && response.status < 300,
        json: async () => (typeof rawData === 'object' ? rawData : JSON.parse(typeof rawData === 'string' ? rawData : JSON.stringify(rawData)))
      };
    }
  } catch (err) {
    console.warn('CapacitorHttp native bypass failed in dictionary, falling back to fetch:', err);
  }

  const res = await fetch(url, options);
  return {
    ok: res.ok,
    json: () => res.json()
  };
}

export async function lookupWord(word: string, sourceLang: string = 'en', targetLang: string = 'tr', isTargetWord?: boolean, _apiKey?: string): Promise<WordTranslation> {
  const cleanWord = word.trim().replace(/^[^\wäöüß]+|[^\wäöüß]+$/gi, ''); // Added basic German chars
  if (!cleanWord) {
    return {
      word,
      normalizedWord: word.toLowerCase(),
      translation: 'Anlam bulunamadı',
      partOfSpeech: 'kelime',
      isTargetWord
    };
  }

  try {
    const sl = isTargetWord ? targetLang : sourceLang;
    const tl = isTargetWord ? sourceLang : targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=bd&q=${encodeURIComponent(cleanWord)}`;
    const res = await smartFetch(url);

    if (res.ok) {
      const data = await res.json();
      
      let primaryMeaning = '';
      if (data[0] && Array.isArray(data[0])) {
        primaryMeaning = data[0].map((chunk: any) => chunk[0]).join('').trim();
      }

      let pos = 'kelime';
      if (data[1] && Array.isArray(data[1])) {
        const dictEntry = data[1][0];
        if (dictEntry) {
          pos = dictEntry[0] || 'kelime';
        }
      }

      return {
        word,
        normalizedWord: cleanWord,
        phonetic: data[0] && data[0][0] && data[0][0][2] ? data[0][0][2] : undefined,
        translation: primaryMeaning,
        partOfSpeech: pos,
        isTargetWord
      };
    }
  } catch (err) {
    console.warn('Word lookup error:', err);
  }

  return {
    word: cleanWord,
    normalizedWord: cleanWord.toLowerCase(),
    translation: cleanWord,
    partOfSpeech: 'kelime',
    isTargetWord
  };
}

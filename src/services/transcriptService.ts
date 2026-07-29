import { CapacitorHttp } from '@capacitor/core';
import type { SubtitleCue, VideoInfo } from '../types';
import { getCachedTranscript, cacheTranscript } from './cacheService';

export function extractYouTubeId(urlOrId: string): string {
  const clean = urlOrId.trim();
  if (clean.length === 11 && !clean.includes('/')) {
    return clean;
  }
  
  const regExp = /[\s\S]*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?\s]*)/;
  const match = clean.match(regExp);
  return (match && match[2].length === 11) ? match[2] : clean;
}

export const POPULAR_VIDEOS: VideoInfo[] = [
  {
    id: '0VBIICYDjPo',
    title: '6 AIs WORK TOGETHER to Build A Programming Language',
    channel: 'WeeklyHow',
    thumbnail: 'https://img.youtube.com/vi/0VBIICYDjPo/hqdefault.jpg',
    duration: '9:11'
  },
  {
    id: 'L_LUpnjgPso',
    title: 'How Artificial Intelligence Works',
    channel: 'TechExplained',
    thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
    duration: '10:15'
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Queen – Bohemian Rhapsody',
    channel: 'Queen Official',
    thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    duration: '6:00'
  }
];

// Fail-safe fetch wrapper with strict timeout limit
export async function smartFetch(url: string, options?: { method?: string; headers?: any; body?: string, responseType?: 'text' | 'json' | 'arraybuffer' | 'blob' }, timeoutMs = 4000): Promise<{ ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<any>; arrayBuffer: () => Promise<ArrayBuffer> }> {
  const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

  const fetchPromise = (async () => {
    if (isNative) {
      const response = await CapacitorHttp.request({
        url,
        method: options?.method || 'GET',
        headers: options?.headers || { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14)' },
        data: options?.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
        responseType: options?.responseType
      });
      const rawData = response.data;
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        text: async () => (typeof rawData === 'string' ? rawData : JSON.stringify(rawData)),
        json: async () => (typeof rawData === 'object' ? rawData : JSON.parse(typeof rawData === 'string' ? rawData : JSON.stringify(rawData))),
        arrayBuffer: async () => {
          if (typeof rawData === 'string') {
            const binaryString = atob(rawData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
          }
          throw new Error('Native response data is not a base64 string for arrayBuffer');
        }
      };
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        method: options?.method || 'GET',
        headers: options?.headers,
        body: options?.body,
        signal: controller.signal
      });

      clearTimeout(timer);

      return {
        ok: res.ok,
        status: res.status,
        text: () => res.text(),
        json: () => res.json(),
        arrayBuffer: () => res.arrayBuffer()
      };
    }
  })();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
  );

  return Promise.race([fetchPromise, timeoutPromise]);
}

export async function fetchVideoSubtitles(
  videoId: string,
  sourceLang: string = 'auto',
  targetLang: string = 'tr',
  apiKey?: string,
  onFastCuesReady?: (cues: SubtitleCue[]) => void
): Promise<{ cues: SubtitleCue[]; isAiTranslated: boolean }> {
  
  // 0. Check Cache First
  const cached = await getCachedTranscript(videoId, sourceLang, targetLang);
  if (cached) {
    if (onFastCuesReady) onFastCuesReady(cached.cues);
    return cached;
  }

  let rawCues: { id: string; start: number; end: number; text: string }[] = [];
  let detectedLang = sourceLang === 'auto' ? 'en' : sourceLang;

  // 1. Try Local Server Dev Endpoint (Fastest on Dev)
  try {
    const res = await smartFetch(`https://yt-ceviri-api.erencloudflare.workers.dev/api/transcript?v=${videoId}&app_token=ytceviri_secure_2026&lang=${sourceLang}`, undefined, 2500);
    if (res.ok) {
      const data = await res.json();
      if (data.cues && Array.isArray(data.cues) && data.cues.length > 0) {
        rawCues = data.cues;
        detectedLang = data.lang || 'en';
      }
    }
  } catch (err) {
    // Expected in standalone APK production mode
  }

  // 2. Try Direct Client InnerTube Fetching
  if (rawCues.length === 0) {
    try {
      const clientRes = await fetchClientInnerTube(videoId, sourceLang);
      if (clientRes.cues.length > 0) {
        rawCues = clientRes.cues;
        detectedLang = clientRes.lang;
      }
    } catch (err) {
      console.warn('Client InnerTube fetch error:', err);
    }
  }

  // 3. Fallback: Public Timedtext CORS Proxies
  if (rawCues.length === 0) {
    const proxyUrls = sourceLang === 'auto' 
      ? [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&fmt=srv3`)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=de&fmt=srv3`)}`
        ]
      : [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${sourceLang}&fmt=srv3`)}`
        ];

    for (const url of proxyUrls) {
      try {
        const res = await smartFetch(url, undefined, 3000);
        if (res.ok) {
          const xml = await res.text();
          const parsed = parseTimedTextXml(xml);
          if (parsed.length > 0) {
            rawCues = parsed;
            const langMatch = url.match(/lang=([^&]+)/);
            detectedLang = langMatch ? langMatch[1] : detectedLang;
            break;
          }
        }
      } catch (e) {
        console.warn('Proxy fetch error:', e);
      }
    }
  }

  if (rawCues.length === 0) {
    return { cues: [], isAiTranslated: false };
  }

  // Initial raw cues
  const initialCues: SubtitleCue[] = rawCues.map(c => ({
    id: c.id,
    start: c.start,
    end: c.end,
    sourceText: c.text,
    targetText: ''
  }));

  // FAST PATH: Translate sentence groups in parallel so BOTH exist immediately
  const fastCues = await translateFastParallel(initialCues, detectedLang, targetLang);
  
  if (onFastCuesReady) {
    onFastCuesReady(fastCues);
  }

  // Safe Gemma 4 31B IT AI translation (never crashes or hangs if API key is invalid)
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const aiCues = await translateWithGemmaAI(fastCues, detectedLang, targetLang, apiKey.trim());
      if (aiCues && aiCues.length > 0) {
        await cacheTranscript(videoId, sourceLang, targetLang, aiCues, true);
        return { cues: aiCues, isAiTranslated: true };
      }
    } catch (err) {
      console.warn('Gemma AI translation error (falling back to fast cues):', err);
    }
  }

  await cacheTranscript(videoId, sourceLang, targetLang, fastCues, true);
  return { cues: fastCues, isAiTranslated: true };
}


async function fetchClientInnerTube(videoId: string, sourceLang: string = 'auto'): Promise<{ cues: any[]; lang: string }> {
  const watchRes = await smartFetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, 10000);
  const html = await watchRes.text();

  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const apiKey = keyMatch ? keyMatch[1] : '';

  if (!apiKey) return { cues: [], lang: 'en' };

  const playerRes = await smartFetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({
      context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
      videoId
    })
  }, 10000);

  const playerData = await playerRes.json();
  const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

  if (captionTracks.length === 0) return { cues: [], lang: 'en' };

  let selectedTrack = captionTracks[0];
  if (sourceLang !== 'auto') {
    selectedTrack = captionTracks.find((t: any) => t.languageCode === sourceLang || t.languageCode?.startsWith(sourceLang)) || captionTracks[0];
  } else {
    // Prefer EN if auto, otherwise first track
    selectedTrack = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || captionTracks[0];
  }

  const trackLang = selectedTrack.languageCode?.split('-')[0] || 'en';
  let baseUrl = selectedTrack.baseUrl;

  if (!baseUrl.includes('&fmt=')) {
    baseUrl += '&fmt=srv3';
  }

  const xmlRes = await smartFetch(baseUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  }, 10000);
  const xmlData = await xmlRes.text();

  const lines = parseTimedTextXml(xmlData);
  return { cues: lines, lang: trackLang };
}

function parseTimedTextXml(xmlData: string): any[] {
  const lines: any[] = [];
  const pRegex = /<p t="(\d+)" d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  let idx = 1;

  while ((m = pRegex.exec(xmlData)) !== null) {
    const startMs = parseInt(m[1]);
    const durMs = parseInt(m[2]);
    const innerHtml = m[3];
    const text = innerHtml.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n/g, ' ').trim();
    if (text) {
      lines.push({ id: String(idx++), start: startMs / 1000, end: (startMs + durMs) / 1000, text });
    }
  }

  if (lines.length === 0) {
    const textRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
    while ((m = textRegex.exec(xmlData)) !== null) {
      const start = parseFloat(m[1]);
      const dur = parseFloat(m[2]);
      const text = m[3].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n/g, ' ').trim();
      if (text) {
        lines.push({ id: String(idx++), start, end: start + dur, text });
      }
    }
  }

  return lines;
}


interface CueGroup {
  cues: SubtitleCue[];
  sourceText: string;
  translatedText?: string;
}

async function translateFastParallel(cues: SubtitleCue[], sourceLang: string, targetLang: string): Promise<SubtitleCue[]> {
  const groups: CueGroup[] = [];

  let currentCues: SubtitleCue[] = [];
  let currentText = '';

  for (let i = 0; i < cues.length; i++) {
    const text = cues[i].sourceText || '';
    currentCues.push(cues[i]);
    currentText += (currentText ? ' ' : '') + text;

    const endsWithPunct = /[.?!]$/.test(text.trim());
    if (endsWithPunct || currentCues.length >= 3 || i === cues.length - 1) {
      groups.push({
        cues: [...currentCues],
        sourceText: currentText
      });
      currentCues = [];
      currentText = '';
    }
  }

  // Process in batches of 40 using <div> batching to completely avoid 429 Too Many Requests
  const batchSize = 40;
  for (let i = 0; i < groups.length; i += batchSize) {
    const chunk = groups.slice(i, i + batchSize);
    
    // Combine texts into <div> blocks
    const combinedHtml = chunk.map(g => `<div>${g.sourceText}</div>`).join('');
    
    try {
      const translatedHtml = await translateGTX(combinedHtml, sourceLang, targetLang);
      
      // Extract translated texts from <div> blocks
      const translatedDivs = translatedHtml.match(/<div[^>]*>([\s\S]*?)<\/div>/gi);
      
      for (let j = 0; j < chunk.length; j++) {
        if (translatedDivs && translatedDivs[j]) {
          chunk[j].translatedText = translatedDivs[j].replace(/<\/?div[^>]*>/gi, '').trim();
        } else {
          chunk[j].translatedText = chunk[j].sourceText;
        }
      }
    } catch (e) {
      for (const group of chunk) {
        group.translatedText = group.sourceText;
      }
    }
  }

  const finalCues: SubtitleCue[] = [];
  for (const group of groups) {
    const translatedText = group.translatedText || group.sourceText;
    const translatedWords = translatedText.split(' ').filter(w => w.trim());
    const sourceLength = group.sourceText.length || 1;
    
    let wordIdx = 0;
    for (let i = 0; i < group.cues.length; i++) {
      const cue = group.cues[i];
      const textLen = cue.sourceText?.length || 0;
      const ratio = textLen / sourceLength;
      const wordCount = i === group.cues.length - 1 
        ? translatedWords.length - wordIdx 
        : Math.round(translatedWords.length * ratio);
      
      const segmentTr = translatedWords.slice(wordIdx, wordIdx + wordCount).join(' ');
      wordIdx += wordCount;

      finalCues.push({
        ...cue,
        sourceText: cue.sourceText,
        targetText: segmentTr,
        isAiTranslated: true
      });
    }
  }

  return finalCues;
}

async function translateWithGemmaAI(cues: SubtitleCue[], _detectedLang: string, targetLang: string, apiKey: string): Promise<SubtitleCue[]> {
  
  const targetLangMap: Record<string, string> = {
    'tr': 'natural Turkish',
    'en': 'natural English',
    'de': 'natural German',
  };
  const targetLangName = targetLangMap[targetLang] || `natural ${targetLang}`;
  const chunkSize = 100;
  let translatedCues = [...cues];

  for (let i = 0; i < cues.length; i += chunkSize) {
    const targetCues = cues.slice(i, i + chunkSize);
    const jsonPayload = targetCues.map(c => ({
      id: c.id,
      text: c.sourceText
    }));

    try {
      const response = await smartFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert ${targetLangName} translator. Translate the "text" field of each object in this JSON array into contextually accurate ${targetLangName}. Maintain the flow of conversation across chunks. Return ONLY a valid JSON array of objects, where each object has the same "id" and the translated "text". Do not combine chunks. No markdown formatting outside the JSON array.\n${JSON.stringify(jsonPayload)}`
              }]
            }]
          })
        },
        12000 // 12 second timeout for complex chunking
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const translatedArr: { id: string, text: string }[] = JSON.parse(jsonMatch[0]);
          const translatedMap = new Map(translatedArr.map(item => [item.id, item.text]));
          
          translatedCues = translatedCues.map(c => {
            const translatedText = translatedMap.get(c.id);
            if (translatedText) {
              return {
                ...c,
                targetText: translatedText,
                isAiTranslated: true
              };
            }
            return c;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse/fetch Gemma array JSON chunk', e);
    }
  }

  return translatedCues;
}

async function translateGTX(text: string, fromLang: string, toLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await smartFetch(url, undefined, 3000);
  if (res.ok) {
    const json = await res.json();
    if (json[0] && Array.isArray(json[0])) {
      const fullTr = json[0].map((chunk: any) => chunk[0]).join('').trim();
      if (fullTr && fullTr !== text) {
        return fullTr;
      }
    }
  }
  return text;
}

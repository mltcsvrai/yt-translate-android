import { get, set } from 'idb-keyval';
import type { SubtitleCue } from '../types';

export async function getCachedTranscript(videoId: string, sourceLang: string, targetLang: string): Promise<{ cues: SubtitleCue[], isAiTranslated: boolean } | null> {
  try {
    const data = await get<{ cues: SubtitleCue[], isAiTranslated: boolean }>(`transcript_${videoId}_${sourceLang}_${targetLang}`);
    return data || null;
  } catch (err) {
    console.error('Failed to get cached transcript:', err);
    return null;
  }
}

export async function cacheTranscript(videoId: string, sourceLang: string, targetLang: string, cues: SubtitleCue[], isAiTranslated: boolean): Promise<void> {
  try {
    // Only cache if there are actual cues to avoid caching empty states
    if (cues && cues.length > 0) {
      await set(`transcript_${videoId}_${sourceLang}_${targetLang}`, { cues, isAiTranslated });
    }
  } catch (err) {
    console.error('Failed to cache transcript:', err);
  }
}

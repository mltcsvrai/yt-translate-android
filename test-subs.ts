import { fetchVideoSubtitles } from './src/services/transcriptService.ts';

// We must stub things that rely on browser globals.
global.window = { Capacitor: { isNativePlatform: () => false } } as any;

async function test() {
  try {
    const { cues, isAiTranslated } = await fetchVideoSubtitles('0VBIICYDjPo', 'auto', 'tr', '');
    console.log("Cues count:", cues.length);
    if(cues.length > 0) {
      console.log("First cue:", cues[0]);
    } else {
      console.log("No cues found.");
    }
  } catch(e) {
    console.error(e);
  }
}
test();

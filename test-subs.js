import { fetchVideoSubtitles } from './src/services/transcriptService.js';
import fetch from 'node-fetch';

global.window = { Capacitor: undefined };
global.fetch = fetch;

// Mock smartFetch since it relies on browser fetch/Capacitor
import { smartFetch } from './src/services/transcriptService.js';

async function test() {
  try {
    const { cues, isAiTranslated } = await fetchVideoSubtitles('0VBIICYDjPo', 'auto', 'tr', '');
    console.log("Cues count:", cues.length);
    if(cues.length > 0) console.log(cues[0]);
  } catch(e) {
    console.error(e);
  }
}
test();

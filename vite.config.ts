import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'https';
import packageJson from './package.json' with { type: 'json' };

function youtubeTranscriptPlugin(): Plugin {
  return {
    name: 'youtube-transcript-plugin',
    configureServer(server) {
      server.middlewares.use('/api/transcript', async (req, res) => {
        const urlParams = new URL(req.url || '', 'http://localhost').searchParams;
        const videoId = urlParams.get('v');
        const lang = urlParams.get('lang') || 'auto';

        if (!videoId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing videoId' }));
          return;
        }

        try {
          const result = await fetchRealYouTubeTranscript(videoId, lang);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('Transcript fetch error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    }
  };
}

async function fetchRealYouTubeTranscript(videoId: string, sourceLang: string = 'auto') {
  const html = await new Promise<string>((resolve, reject) => {
    http.get('https://www.youtube.com/watch?v=' + videoId, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  const keyMatch = html.match(/\"INNERTUBE_API_KEY\":\"([^\"]+)\"/);
  const apiKey = keyMatch ? keyMatch[1] : '';

  const playerRes = await new Promise<any>((resolve, reject) => {
    const r = http.request('https://www.youtube.com/youtubei/v1/player?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    r.on('error', reject);
    r.write(JSON.stringify({ context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } }, videoId }));
    r.end();
  });

  const captionTracks = playerRes?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (captionTracks.length === 0) return { cues: [], lang: 'en' };

  // Detect track by sourceLang
  let selectedTrack = captionTracks[0];
  if (sourceLang !== 'auto') {
    selectedTrack = captionTracks.find((t: any) => t.languageCode === sourceLang || t.languageCode?.startsWith(sourceLang)) || captionTracks[0];
  } else {
    selectedTrack = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || captionTracks[0];
  }

  const trackLang = selectedTrack.languageCode?.split('-')[0] || 'en';
  let baseUrl = selectedTrack.baseUrl;
  if (!baseUrl.includes('&fmt=')) {
    baseUrl += '&fmt=srv3';
  }

  const xmlData = await new Promise<string>((resolve, reject) => {
    http.get(baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });

  const lines: any[] = [];
  const pRegex = /<p t=\"(\d+)\" d=\"(\d+)\"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  let idx = 1;

  while ((m = pRegex.exec(xmlData)) !== null) {
    const startMs = parseInt(m[1]);
    const durMs = parseInt(m[2]);
    const innerHtml = m[3];
    const text = innerHtml.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n/g, ' ').trim();
    if (text) {
      lines.push({
        id: String(idx++),
        start: startMs / 1000,
        end: (startMs + durMs) / 1000,
        text: text
      });
    }
  }

  if (lines.length === 0) {
    const textRegex = /<text start=\"([^\"]+)\" dur=\"([^\"]+)\"[^>]*>([^<]+)<\/text>/g;
    while ((m = textRegex.exec(xmlData)) !== null) {
      const start = parseFloat(m[1]);
      const dur = parseFloat(m[2]);
      const text = m[3].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n/g, ' ').trim();
      if (text) {
        lines.push({
          id: String(idx++),
          start,
          end: start + dur,
          text: text
        });
      }
    }
  }

  return { cues: lines, lang: trackLang };
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
  },
  plugins: [react(), tailwindcss(), youtubeTranscriptPlugin()],
});

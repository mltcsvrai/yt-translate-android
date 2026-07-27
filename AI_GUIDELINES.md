# AI Constitutional Guidelines - YT Çeviri (2026)

## 1. Zero Unsafe & High Aesthetic Policy
- **Visual Excellence**: Modern web application built for Samsung Galaxy Tab S9+ (12.4" AMOLED). Always use rich glassmorphism, dynamic micro-animations, curated dark mode palettes (`slate-950`, `red-600`), and modern typography.
- **No Mock Text / No Dummy Fallbacks**: Never use generic placeholder text. Subtitles and translations must be real and functional.

## 2. Model & Translation Engine Standards
- **Primary AI Model**: Google Gemma 4 31B IT (`gemma-4-31b-it`). Do NOT use `gemini-1.5-flash`.
- **Fast-Path Engine**: Unlimited Google GTX API (`https://translate.googleapis.com/translate_a/single?client=gtx&sl=...&tl=...&dt=t&q=...`) for instant 1-second subtitle rendering before AI enrichment.
- **Bi-Directional Support**: Automatically detects primary caption language. Translates English videos to Turkish (EN ➔ TR) and Turkish videos to English (TR ➔ EN).
- **Proportional Time-Splitting**: Full sentences must be translated as a whole for grammatical correctness and then split proportionally across timestamped subtitle cues.

## 3. Player & UI Controls Unblocking Rules
- **Fullscreen Iframe Isolation**: Native `<iframe>` fullscreen is disabled (`fs: 0`). Fullscreen is executed on parent wrapper (`playerWrapperRef`) so subtitles, full screen toggles, and dictionary tooltips stay visible together.
- **Subtitle & Fullscreen Positioning**: Subtitles sit comfortably at `bottom-20 sm:bottom-24` above YouTube progress bar and chapter titles. Fullscreen button sits at `bottom-14 right-4`.
- **Dynamic Slide Down & Auto-Hide**: When YouTube controls auto-hide (idle time), subtitles slide down smoothly to `bottom-6` and the Fullscreen toggle button smoothly fades out (`opacity-0`).
- **Logo Masking**: YouTube's watermark logo and "Diğer videolar" recommended endscreen cards are masked out via `iv_load_policy: 3` and dark gradient overlays.

## 4. Mobile APK & Cloudflare OTA Architecture
- **Standalone Client InnerTube Engine**: Subtitle fetching in `src/services/transcriptService.ts` must use direct client-side InnerTube scraping so the Capacitor Android APK works 100% standalone without relying on a local Vite server.
- **Cloudflare Worker OTA Updates**: Over-The-Air app version checks are managed via `cloudflare-worker/worker.js` and `updateService.ts`.
- **HER DEĞİŞİKLİKTEN SONRA DEPLOY KURALI (ZORUNLU)**: Herhangi bir kod veya proje değişikliği yapıldıktan sonra İSTİSNASIZ OLARAK Cloudflare Worker deploy edilmeli (`npm run deploy-ota`) ve taze Android APK derlenmelidir (`npx cap sync android && cd android && ./gradlew assembleDebug`).
- **USER PREFERENCE (KULLANICI TERCİHİ)**: Kullanıcı terminal işlemleriyle (derleme, deploy) uğraşmak İSTEMEZ. Gerekli deploy ve APK derleme komutlarını kullanıcıdan izin veya onay beklemeden doğrudan, otomatik olarak (terminal tool kullanarak) çalıştırın ve işlem bitince kullanıcıya sadece bitiş bilgisini (ve gerekirse APK yolunu) verin.

## 5. Memory Bank Rule (ZORUNLU)
This project uses a persistent `memory-bank/` folder as long-term memory for all AI assistants.
- **Rule**: Read all existing files in `memory-bank/` before starting work.
- **Rule**: `projectbrief.md` is the source of truth for scope and goals.
- **Rule**: `activeContext.md` reflects current focus, recent changes, and decisions.
- **Rule**: `progress.md` tracks working features, APK build status, and known issues.
- **Rule**: `systemPatterns.md` documents component architecture and service relationships.
- **Rule**: `techContext.md` documents tech stack, Android SDK setup, and tools.
- **Rule**: `productContext.md` documents user experience goals for Samsung Tab S9+.

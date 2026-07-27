# Project Skills & Workflows - YT Çeviri

## 1. `--prompt` Automated Workflow Skill
Whenever `--prompt` is included in a prompt:
1. **Preparation**: Read `AI_GUIDELINES.md`, `Project_Goals.md`, `PROJECT_SKILLS.md`, and all `memory-bank/` files.
2. **Execution**: Implement the user's task without regressing existing features or UI components.
3. **Mandatory Deploy & APK Build**: Always deploy Cloudflare Worker (`cd cloudflare-worker && npx wrangler deploy`) and assemble fresh Android APK (`npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`).
4. **Memory Bank Auto-Sync**: Automatically update `memory-bank/activeContext.md` and `memory-bank/progress.md` with the new changes and build outputs without waiting for explicit user prompts.

## 2. Dynamic Live Updates (Cloudflare Worker OTA)
- Version manifest served live at `https://yt-ceviri-api.erencloudflare.workers.dev/version.json`.
- In-app update mechanism checks version and applies updates 100% in-app without external browser redirects.

## 3. Capacitor Native Android CORS Bypass
- Uses `@capacitor/core` `CapacitorHttp` to execute network calls via native Android OkHttp.
- Bypasses WebView CORS blocks for InnerTube transcript scraping & GTX dictionary lookups.

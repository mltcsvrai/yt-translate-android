# YT Çeviri (YouTube Context-Aware Translator)

![Banner Placeholder](https://via.placeholder.com/1200x400?text=YT+Ceviri+App)

**YT Çeviri** is an open-source, powerful mobile Android application and web wrapper designed to help you learn languages by providing context-aware, instantaneous translations of YouTube video subtitles. It natively bypasses CORS limits and brings the power of AI (Google Gemini) directly into your subtitle-watching experience.

## ✨ Features

- **Context-Aware Translations**: Powered by Google's Gemini AI, clicking any word in the subtitle doesn't just give you a dictionary definition—it gives you the exact meaning of that word *within the context of the sentence*.
- **Multi-Language Support**: Fully localized in English, Turkish, German, Spanish, and French. Includes an easy-to-use Onboarding flow to pick your native language.
- **Dynamic Subtitle Sync**: YouTube's auto-generated subtitles often suffer from delays. YT Çeviri allows you to dynamically adjust the subtitle offset (-5s to +5s) right from the video player to get perfect lip-sync.
- **Native Android CORS Bypass**: Built with Capacitor, this app routes all YouTube and API requests through the native Android OkHttp layer, flawlessly bypassing strict WebView CORS limits.
- **Cloudflare Worker Backend**: A lightning-fast, edge-deployed Cloudflare Worker proxies and caches YouTube metadata efficiently.
- **Bring Your Own Key (BYOK)**: The app is entirely open-source and free. Users simply input their own Google Gemini API key to activate the intelligent translations.

## 📥 Download & Install

**For Mobile Users:** You don't need to build the app from scratch! 
1. Go to the [Releases page](https://github.com/mltcsvrai/yt-translate-android/releases).
2. Download the latest `app-release.apk` file to your Android device.
3. Install the APK, open the app, enter your Gemini API key, and start watching!

## 🚀 How It Works (Bring Your Own API Key)

This project does not ship with a hardcoded API key to remain free and open-source. 
When you first open the app, you will be greeted with an **Onboarding Screen**. 
1. Select your target language.
2. Enter your **Google Gemini API Key**. (You can get one for free at [Google AI Studio](https://aistudio.google.com/)).
3. Start watching!

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS
- **Mobile Container**: Ionic Capacitor (Android)
- **Backend / Proxy**: Cloudflare Workers
- **AI Engine**: Google Gemini API

## 📦 Installation & Build Instructions

### Prerequisites
- Node.js (v18+)
- Android Studio (for compiling the APK)
- Cloudflare Wrangler CLI (for backend deployment)

### 1. Setup the Web App
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/yt-ceviri.git
cd yt-ceviri

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 2. Deploy the Cloudflare Worker
The worker is needed to securely proxy YouTube metadata.
```bash
cd cloudflare-worker
npm install

# Deploy to your own Cloudflare account
npx wrangler deploy
```
*(Make sure to update the worker URL in your `src/services/youtube.ts` if you deploy your own instance).*

### 3. Build the Android APK
```bash
# Build the React app
npm run build

# Sync files to the Capacitor Android project
npx cap sync android

# Compile the APK
cd android
./gradlew assembleDebug assembleRelease
```
Your compiled APKs will be available in `android/app/build/outputs/apk/`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/YOUR_USERNAME/yt-ceviri/issues).

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

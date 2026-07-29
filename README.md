# YT Çeviri (YouTube Context-Aware Translator)

![YT Çeviri Logo](https://raw.githubusercontent.com/mltcsvrai/yt-translate-android/main/assets/logo.png)

**YT Çeviri** is an open-source, powerful mobile Android application designed to help you learn languages by providing context-aware, instantaneous translations of YouTube video subtitles. It leverages the power of AI (Google Gemini) directly in your subtitle-watching experience.

## ✨ Features

- **Context-Aware Translations**: Powered by Google's Gemini AI, clicking any word in the subtitle gives you the exact meaning of that word *within the context of the sentence*.
- **Idiom & Phrase Highlighting**: The AI intelligently detects multi-word idioms or phrases (e.g., "piece of cake") and highlights them together, preventing awkward word-by-word translations.
- **Native Android Share Intent**: Directly share any YouTube video from the official YouTube app to YT Çeviri to instantly open and translate it!
- **Over-The-Air (OTA) Live Updates**: Powered by Capgo, the app receives silent, lightning-fast background updates without needing to download a new APK every time.
- **Dynamic Subtitle Sync**: YouTube's auto-generated subtitles often suffer from delays. YT Çeviri allows you to dynamically adjust the subtitle offset (-5s to +5s) right from the video player to get perfect lip-sync.
- **Cloudflare Edge Proxy**: A lightning-fast, edge-deployed Cloudflare Worker proxies and caches YouTube metadata efficiently, completely bypassing CORS issues.
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
3. Start watching by searching a video or sharing one from the YouTube app!

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS
- **Mobile Container**: Ionic Capacitor 8 (Android)
- **Live Updates**: Capgo Capacitor Updater
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
git clone https://github.com/mltcsvrai/yt-translate-android.git
cd yt-translate-android

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
Feel free to check the [issues page](https://github.com/mltcsvrai/yt-translate-android/issues).

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

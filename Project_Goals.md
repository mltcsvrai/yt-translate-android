# Project Goals & Scope - YT Çeviri

## Purpose
YT Çeviri, YouTube videolarını tam ekran çift altyazı (İngilizce + Türkçe), yapay zekâ destekli akıllı gramer çevirisi (Google Gemma 4 31B IT), anında tıklamalı kelime sözlüğü (GTX Stemmer) ve otomatik izleme geçmişi (localStorage auto-resume) ile sunan modern bir web ve Android (Capacitor) uygulamasıdır. Özellikle **Samsung Galaxy Tab S9+ (12.4" AMOLED)** tablet ekranı için optimize edilmiştir.

## Core Requirements
1. **Bi-Directional Translation**: İngilizce videoları Türkçe'ye (EN ➔ TR), Türkçe videoları İngilizce'ye (TR ➔ EN) otomatik çevirir.
2. **Instant Fast-Path + Gemma 4 31B IT AI**: Anında Google GTX API ile ~1 saniyede çift altyazıyı ekrana basar, ardından Gemma 4 31B IT ile cümleleri bütünsel çevirip zaman aralıklarına orantılı böler.
3. **Interactive Dictionary**: Subtitle kelimelerine tıklandığında Google GTX API kök kelime (stemmer) analizi ile Türkçe karşılığını, sözcük türünü (isim, fiil, sıfat) ve eşanlamlılarını gösteren popup açar.
4. **Samsung Tab S9+ Ergonomics**: İlerleme çubuğu ve bölüm isimlerini (chapters) kapatmayan dinamik altyazı katmanı. Oynatıcı durduğunda/gizlendiğinde aşağı kayan altyazılar ve otomatik gizlenen Tam Ekran butonu.
5. **Standalone Android APK & Cloudflare OTA**: Mobil APK WebView içerisinde harici Node sunucusuna ihtiyaç duymadan çalışan InnerTube altyazı motoru ve Cloudflare Worker tabanlı Canlı Güncelleme (OTA) sistemi.

## Scope Definitions
- **In-Scope**:
  - React 18 + Vite + TypeScript + Tailwind CSS Frontend.
  - Capacitor Android Native Wrapper & OpenJDK 21 Gradle build.
  - Google Gemma 4 31B IT Integration (`gemma-4-31b-it`).
  - Unlimited Google GTX Translation & Stemmer Dictionary Engine.
  - YouTube InnerTube API Subtitle Extraction (Client + Server Fallback).
  - Cloudflare Worker (`cloudflare-worker/worker.js`) for API Proxy & Live Update Check (`version.json`).
  - Watch progress auto-resume (`localStorage` toast notification).
  - YouTube Logo & Endscreen Card Masking (`iv_load_policy: 3`).
- **Out-of-Scope**:
  - Direct video file downloading or MP4 converting.
  - Paid subscription or paywall auth logic.

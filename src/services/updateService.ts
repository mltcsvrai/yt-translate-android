import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

export interface AppUpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  bundleUrl?: string;
}

export const CURRENT_APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.4';

// Replace 1.0. with 0.0. for display purposes (so 1.0.4 becomes 0.0.4)
export const DISPLAY_VERSION = CURRENT_APP_VERSION.replace(/^1\.0\./, '0.0.');

export async function checkAppUpdates(): Promise<AppUpdateInfo> {
  const checkUrl = 'https://yt-ceviri-api.erencloudflare.workers.dev/version.json';

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(checkUrl, { signal: controller.signal }).finally(() => clearTimeout(timer));

    if (res.ok) {
      const data = await res.json();
      
      // Get currently running version from CapacitorUpdater (or fallback to CURRENT_APP_VERSION)
      let activeVersion = CURRENT_APP_VERSION;
      if (Capacitor.isNativePlatform()) {
        try {
          const status = await CapacitorUpdater.current();
          if (status?.bundle?.id) {
            activeVersion = status.bundle.id;
          }
        } catch (e) {
          console.warn('Could not get current bundle version:', e);
        }
      }

      // If active bundle version is somehow older than the hardcoded native APK version, prefer native
      if (compareVersions(CURRENT_APP_VERSION, activeVersion) > 0) {
        activeVersion = CURRENT_APP_VERSION;
      }

      if (data.version && compareVersions(data.version, activeVersion) > 0) {
        return {
          hasUpdate: true,
          latestVersion: data.version,
          releaseNotes: data.releaseNotes || 'Yeni sürüm indirilebilir.',
          downloadUrl: data.downloadUrl,
          bundleUrl: data.bundleUrl
        };
      }
    }
  } catch (err) {
    console.warn('Update check bypassed:', err);
  }

  return { hasUpdate: false };
}

export async function applyInAppUpdate(version: string, bundleUrl: string, onProgress?: (percent: number) => void) {
  if (!Capacitor.isNativePlatform()) {
    console.warn('OTA updates are only supported on native devices.');
    return;
  }

  try {
    if (onProgress) {
      CapacitorUpdater.addListener('download', (info: any) => {
        if (info.percent) {
          onProgress(Math.round(info.percent));
        }
      });
    }

    const downloadRes = await CapacitorUpdater.download({
      url: bundleUrl,
      version: version
    });

    await CapacitorUpdater.set({ id: downloadRes.id });
  } catch (error) {
    console.error('OTA Update Failed:', error);
    throw error;
  }
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}
